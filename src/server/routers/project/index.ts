import { PreferenceType, Stage } from "@prisma/client";
import { z } from "zod";

import { expand, toPP2 } from "@/lib/utils/general/instance-params";
import {
  previousStages,
  subsequentStages,
} from "@/lib/utils/permissions/stage-check";
import { instanceParamsSchema } from "@/lib/validations/params";
import { updatedProjectSchema } from "@/lib/validations/project-form";

import { procedure } from "@/server/middleware";
import { createTRPCRouter } from "@/server/trpc";

import { computeProjectSubmissionTarget } from "@/config/submission-target";
import { updateProjectAllocation } from "@/db/transactions/project-allocation";
import { linkProjectFlags } from "@/db/transactions/project-flags";
import { flagDtoSchema, tagDtoSchema } from "@/dto";
import { projectDtoSchema } from "@/dto/project";
import { studentDtoSchema } from "@/dto/user/student";
import { supervisorDtoSchema } from "@/dto/user/supervisor";
import { Transformers as T } from "@/db/transformers";

export const projectRouter = createTRPCRouter({
  // ok
  exists: procedure.project.user
    .output(z.boolean())
    .query(async ({ ctx: { project } }) => await project.exists()),

  // pin
  edit: procedure.project
    .inStage(subsequentStages(Stage.PROJECT_ALLOCATION))
    .supervisor.input(z.object({ updatedProject: updatedProjectSchema }))
    .output(z.void())
    .mutation(
      async ({
        ctx: { db, project },
        input: {
          updatedProject: {
            title,
            description,
            capacityUpperBound,
            preAllocatedStudentId,
            specialTechnicalRequirements,
            tags,
            flagTitles,
          },
        },
      }) => {
        const newPreAllocatedStudentId = preAllocatedStudentId || undefined;

        await db.$transaction(async (tx) => {
          const oldProjectData = await tx.project.findFirstOrThrow({
            where: toPP2(project.params),
            select: { preAllocatedStudentId: true },
          });

          const prevPreAllocatedStudentId =
            oldProjectData.preAllocatedStudentId;

          const requiresDelete =
            prevPreAllocatedStudentId && // if there is an old version
            prevPreAllocatedStudentId !== newPreAllocatedStudentId; // and it doesn't match

          const requiresCreate =
            newPreAllocatedStudentId && // if there is a new student
            prevPreAllocatedStudentId !== newPreAllocatedStudentId; // and it doesn't match

          if (requiresDelete) {
            await tx.studentProjectAllocation.delete({
              where: {
                studentProjectAllocationId: {
                  allocationGroupId: project.params.group,
                  allocationSubGroupId: project.params.subGroup,
                  allocationInstanceId: project.params.instance,
                  userId: prevPreAllocatedStudentId,
                },
              },
            });
          }

          if (requiresCreate) {
            await updateProjectAllocation(tx, {
              ...project.params,
              preAllocatedStudentId: newPreAllocatedStudentId,
            });
          }

          await tx.project.update({
            where: toPP2(project.params),
            data: {
              title: title,
              description: description,
              capacityUpperBound: capacityUpperBound,
              preAllocatedStudentId: newPreAllocatedStudentId ?? null,
              latestEditDateTime: new Date(),
              specialTechnicalRequirements:
                specialTechnicalRequirements ?? null,
            },
          });

          await tx.flagOnProject.deleteMany({
            where: {
              projectId: project.params.projectId,
              AND: { flag: { title: { notIn: flagTitles } } },
            },
          });

          await linkProjectFlags(
            tx,
            project.instance.params,
            project.params.projectId,
            flagTitles,
          );

          await tx.tag.createMany({
            data: tags.map((tag) => ({
              allocationGroupId: project.params.group,
              allocationSubGroupId: project.params.subGroup,
              allocationInstanceId: project.params.instance,
              ...tag,
            })),
            skipDuplicates: true,
          });

          await tx.tagOnProject.deleteMany({
            where: {
              projectId: project.params.projectId,
              AND: { tagId: { notIn: tags.map(({ id }) => id) } },
            },
          });

          await tx.tagOnProject.createMany({
            data: tags.map(({ id }) => ({
              tagId: id,
              projectId: project.params.projectId,
            })),
            skipDuplicates: true,
          });
        });
      },
    ),

  // TODO rename + review output type
  getAllForStudentPreferences: procedure.instance.user
    .input(z.object({ studentId: z.string() }))
    .output(
      z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          flags: z.array(flagDtoSchema),
        }),
      ),
    )
    .query(async ({ ctx: { instance }, input: { studentId } }) => {
      const projectData = await instance.getProjectDetails();

      const student = await instance.getStudent(studentId);
      const studentData = await student.get();
      const preferences = await student.getAllDraftPreferences();

      const preferenceIds = new Set(preferences.map(({ project: p }) => p.id));

      return projectData
        .filter((p) => {
          if (preferenceIds.has(p.project.id)) return false;
          const projectFlags = new Set(p.project.flags.map((f) => f.title));
          const studentFlags = new Set(studentData.flags.map((f) => f.title));
          return studentFlags.intersection(projectFlags).size !== 0;
        })
        .map((p) => ({
          id: p.project.id,
          title: p.project.title,
          flags: p.project.flags,
        }));
    }),

  // BREAKING input/output type
  getAllForUser: procedure.instance.user
    .output(
      z.array(
        z.object({
          project: projectDtoSchema,
          supervisor: supervisorDtoSchema,
          preAllocatedStudentId: z.string().optional(),
        }),
      ),
    )
    .query(async ({ ctx: { instance, user } }) => {
      // if you are any kind of staff member, you should be able to see all projects
      // if you are a student, you should only be able to see projects that you are eligible for
      const projectData = await instance.getProjectDetails();

      if (await user.isInstanceStudent(instance.params)) {
        const student = await user.toInstanceStudent(instance.params);
        const studentData = await student.get();

        return projectData
          .filter((p) => {
            const projectFlags = new Set(p.project.flags.map((f) => f.title));
            const studentFlags = new Set(studentData.flags.map((f) => f.title));
            return studentFlags.intersection(projectFlags).size !== 0;
          })
          .map((p) => ({
            project: p.project,
            supervisor: p.supervisor,
            preAllocatedStudentId: p.project.preAllocatedStudentId,
          }));
      }
      return projectData.map((p) => ({
        project: p.project,
        supervisor: p.supervisor,
        preAllocatedStudentId: p.project.preAllocatedStudentId,
      }));
    }),

  // BREAKING output type
  getAllLateProposals: procedure.instance.subGroupAdmin
    .output(z.array(projectDtoSchema))
    .query(async ({ ctx: { instance } }) => await instance.getLateProjects()),

  // ok
  // BREAKING output type
  getAllPreAllocated: procedure.instance
    .inStage(subsequentStages(Stage.PROJECT_SUBMISSION))
    .subGroupAdmin.output(
      z.array(
        z.object({
          project: projectDtoSchema,
          supervisor: supervisorDtoSchema,
          student: studentDtoSchema,
        }),
      ),
    )
    .query(async ({ ctx: { instance } }) => await instance.getPreAllocations()),

  // ok
  getById: procedure.project.user
    .output(projectDtoSchema)
    .query(async ({ ctx: { db, project } }) => {
      // project.get
      const data = await db.project.findFirstOrThrow({
        where: toPP2(project.params),
        include: {
          supervisor: {
            include: { userInInstance: { include: { user: true } } },
          },
          flagsOnProject: { include: { flag: true } },
          tagsOnProject: { include: { tag: true } },
        },
      });

      return T.toProjectDTO(data);
    }),

  // ok
  getIsForked: procedure.project.user.query(
    async ({
      ctx: { instance, db },
      input: {
        params: { projectId },
      },
    }) => {
      const { parentInstanceId } = await instance.get();

      const projects = await db.project.findMany({
        where: {
          id: projectId,
          OR: [
            expand(instance.params),
            expand(instance.params, parentInstanceId),
          ],
        },
      });

      return projects.length === 2;
    },
  ),

  // MOVE to ac
  // ok
  getUserAccess: procedure.project.user
    .input(z.object({ params: instanceParamsSchema, projectId: z.string() }))
    .output(
      z.discriminatedUnion("access", [
        z.object({ access: z.literal(true) }),
        z.object({ access: z.literal(false), error: z.string() }),
      ]),
    )
    .query(async ({ ctx: { user, instance, project } }) => {
      if (await user.isInstanceStaff(instance.params)) {
        return { access: true };
      } else if (await user.isInstanceStudent(instance.params)) {
        const student = await user.toInstanceStudent(instance.params);

        const { flags: studentFlags } = await student.get();
        const studentFlagSet = new Set(studentFlags);

        const projectFlags = await project.getFlags();
        const projectFlagsSet = new Set(projectFlags);

        if (studentFlagSet.intersection(projectFlagsSet).size !== 0) {
          return { access: true };
        } else {
          return {
            access: false,
            error: "Student not eligible for this project",
          };
        }
      }

      return { access: false, error: "Not a member of this instance" };
    }),

  // ok
  //getStudentPreferencesForId
  getAllStudentPreferences: procedure.project.user
    .output(
      z.array(
        z.object({
          student: studentDtoSchema,
          preference: z.object({
            type: z.nativeEnum(PreferenceType).or(z.literal("SUBMITTED")),
            rank: z.number().optional(),
          }),
        }),
      ),
    )
    .query(async ({ ctx: { instance, project, db } }) => {
      const projectId = project.params.projectId;
      const studentPreferences = await instance.getStudentPreferenceDetails();

      const studentPreferenceMap = studentPreferences.reduce(
        (acc, val) => {
          const draft = val.draftPreferences
            .filter((x) => x.type === PreferenceType.PREFERENCE)
            .map((x) => x.projectId);

          return { ...acc, [val.institutionId]: draft };
        },
        {} as Record<string, string[]>,
      );

      const hello = await db.project.findFirstOrThrow({
        where: toPP2(project.params),
        include: {
          inStudentDraftPreferences: {
            include: {
              student: {
                include: {
                  studentFlags: { include: { flag: true } },
                  userInInstance: { include: { user: true } },
                },
              },
            },
          },
          inStudentSubmittedPreferences: {
            include: {
              student: {
                include: {
                  studentFlags: { include: { flag: true } },
                  userInInstance: { include: { user: true } },
                },
              },
            },
          },
        },
      });

      const submittedPreferences = hello.inStudentSubmittedPreferences.map(
        (x) => ({
          student: T.toStudentDTO(x.student),
          preference: { type: "SUBMITTED" as const, rank: x.rank },
        }),
      );

      const draftPreferences = hello.inStudentDraftPreferences.map((x) => {
        const student = T.toStudentDTO(x.student);
        return {
          student,
          preference: {
            type: x.type,
            rank:
              x.type === PreferenceType.PREFERENCE
                ? studentPreferenceMap[x.student.userId]!.indexOf(projectId) + 1
                : undefined,
          },
        };
      });

      return [...submittedPreferences, ...draftPreferences];
    }),

  // ok
  // TODO: @JakeTrevor admins should also be able to delete projects
  delete: procedure.project
    .inStage(previousStages(Stage.PROJECT_ALLOCATION))
    .supervisor.output(z.void())
    .mutation(async ({ ctx: { project } }) => await project.delete()),

  // ok
  // supervisor or admin
  deleteSelected: procedure.instance
    .inStage(previousStages(Stage.PROJECT_ALLOCATION))
    .user.input(z.object({ projectIds: z.array(z.string()) }))
    .mutation(
      async ({ ctx: { instance }, input: { projectIds } }) =>
        await instance.deleteProjects(projectIds),
    ),

  // ok
  // MOVE to instance
  details: procedure.instance.user
    .output(
      z.object({ flags: z.array(flagDtoSchema), tags: z.array(tagDtoSchema) }),
    )
    .query(async ({ ctx: { instance } }) => ({
      flags: await instance.getFlagsOnProjects(),
      tags: await instance.getTagsOnProjects(),
    })),

  // ok
  // TODO: change input type
  create: procedure.instance
    .inStage([Stage.PROJECT_SUBMISSION, Stage.STUDENT_BIDDING])
    .user.input(
      z.object({ newProject: updatedProjectSchema, supervisorId: z.string() }),
    )
    .output(z.void())
    .mutation(
      async ({
        ctx: { instance, db },
        input: { supervisorId, newProject },
      }) => {
        await db.$transaction(async (tx) => {
          const project = await tx.project.create({
            data: {
              ...expand(instance.params),
              title: newProject.title,
              description: newProject.description,
              capacityLowerBound: 0,
              capacityUpperBound: newProject.capacityUpperBound,
              preAllocatedStudentId: newProject.preAllocatedStudentId || null,
              specialTechnicalRequirements:
                newProject.specialTechnicalRequirements ?? null,
              latestEditDateTime: new Date(),
              supervisorId,
            },
          });

          // TODO: disallow empty string
          if (
            newProject.preAllocatedStudentId &&
            newProject.preAllocatedStudentId !== ""
          ) {
            db.studentProjectAllocation.create({
              data: {
                ...expand(instance.params),
                userId: newProject.preAllocatedStudentId,
                projectId: project.id,
                studentRanking: 1,
              },
            });
          }

          await linkProjectFlags(
            tx,
            instance.params,
            project.id,
            newProject.flagTitles,
          );

          await tx.tagOnProject.createMany({
            data: newProject.tags.map(({ id: tagId }) => ({
              tagId,
              projectId: project.id,
            })),
          });
        });
      },
    ),

  // BREAKING output type
  getFormDetails: procedure.instance.user
    .input(z.object({ projectId: z.string().optional() }))
    .output(
      z.object({
        takenTitles: z.set(z.string()),
        flags: z.array(flagDtoSchema),
        tags: z.array(tagDtoSchema),
        students: z.array(studentDtoSchema),
      }),
    )
    .query(async ({ ctx: { instance }, input: { projectId } }) => {
      // make sure only students with the correct data are returned (big asterisk considering you can change the flags on a project)
      // so instead get all unallocated students and filter them on the client based on the selected flags

      const allProjects = await instance.getProjectDetails();
      const takenTitles = new Set(allProjects.map(({ project: p }) => p.title));

      if (projectId) {
        const project = await instance.getProject(projectId).get();
        takenTitles.delete(project.title);
      }

      return {
        takenTitles,
        students: await instance.getUnallocatedStudents(),
        flags: await instance.getFlags(),
        tags: await instance.getTags(),
      };
    }),

  // ok
  getAllocation: procedure.project.user
    .input(z.object({ projectId: z.string() }))
    .output(
      z.object({ student: studentDtoSchema, rank: z.number() }).optional(),
    )
    .query(async ({ ctx: { db }, input: { projectId } }) => {
      const allocation = await db.studentProjectAllocation.findFirst({
        where: { projectId },
        include: {
          student: {
            include: {
              userInInstance: { include: { user: true } },
              studentFlags: { include: { flag: true } },
            },
          },
        },
      });

      if (!allocation) return undefined;

      return {
        student: T.toStudentDTO(allocation.student),
        rank: allocation.studentRanking,
      };
    }),

  // ok
  // @JakeTrevor this seems to have already been done, looks good for a merge
  // TODO: change output type
  supervisorSubmissionInfo: procedure.instance.subGroupAdmin
    .output(
      z.array(
        z.object({
          email: z.string(),
          name: z.string(),
          userId: z.string(),
          submittedProjectsCount: z.number(),
          projectAllocationTarget: z.number(),
          allocatedCount: z.number(),
          submissionTarget: z.number(),
          targetMet: z.boolean(),
        }),
      ),
    )
    .query(async ({ ctx: { instance } }) => {
      const instanceData = await instance.get();

      const currentInstanceSubmissionDetails =
        await instance.getSupervisorSubmissionDetails();

      if (!instanceData.parentInstanceId) {
        return currentInstanceSubmissionDetails.map((c) => ({
          ...c,
          targetMet: c.submittedProjectsCount >= c.submissionTarget,
        }));
      }

      const parent = await instance.getParentInstance();
      const parentInstanceSubmissionDetails =
        await parent.getSupervisorSubmissionDetails();

      const parentAllocationMap = parentInstanceSubmissionDetails.reduce(
        (acc, val) => ({ ...acc, [val.userId]: val.submittedProjectsCount }),
        {} as Record<string, number>,
      );

      return currentInstanceSubmissionDetails.map((f) => {
        const newAllocatedCount =
          f.allocatedCount + (parentAllocationMap[f.userId] ?? 0);

        const newSubmissionTarget = computeProjectSubmissionTarget(
          f.projectAllocationTarget,
          newAllocatedCount,
        );

        return {
          ...f,
          allocatedCount: newAllocatedCount,
          submissionTarget: newSubmissionTarget,
          targetMet: f.submittedProjectsCount >= newSubmissionTarget,
        };
      });
    }),
});

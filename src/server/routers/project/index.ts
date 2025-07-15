import { PreferenceType, Stage } from "@prisma/client";
import { z } from "zod";

import { expand, toPP2 } from "@/lib/utils/general/instance-params";

import {
  previousStages,
  subsequentStages,
} from "@/lib/utils/permissions/stage-check";
import { projectForm } from "@/dto/project";

import { procedure } from "@/server/middleware";
import { createTRPCRouter } from "@/server/trpc";

import {
  linkPreAllocatedStudent,
  linkProjectFlagIds,
  linkProjectTagIds,
} from "@/db/transactions/project-flags";
import { flagDtoSchema, tagDtoSchema } from "@/dto";
import { projectDtoSchema } from "@/dto";
import { studentDtoSchema } from "@/dto";
import { supervisorDtoSchema } from "@/dto";
import { Transformers as T } from "@/db/transformers";
import { Role } from "@/db/types";
import {
  PermissionResult,
  permissionResultSchema,
} from "@/dto/result/permission-result";

export const projectRouter = createTRPCRouter({
  // ok
  exists: procedure.project.user
    .output(z.boolean())
    .query(async ({ ctx: { project } }) => await project.exists()),

  edit: procedure.project
    .inStage(previousStages(Stage.STUDENT_BIDDING))
    .withRoles([Role.ADMIN, Role.SUPERVISOR])
    .input(z.object({ updatedProject: projectForm.editApiInputSchema }))
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
            supervisorId,
            tagIds,
            flagIds,
          },
        },
      }) => {
        await db.$transaction(async (tx) => {
          await tx.project.update({
            where: toPP2(project.params),
            data: {
              title,
              description,
              capacityUpperBound,
              supervisorId,
              preAllocatedStudentId: preAllocatedStudentId ?? null,
              latestEditDateTime: new Date(),
              specialTechnicalRequirements,
            },
          });

          if (preAllocatedStudentId && preAllocatedStudentId.trim() !== "") {
            // ! would just override another pre-allocated student - bad probably
            await linkPreAllocatedStudent(
              tx,
              project.params,
              preAllocatedStudentId,
            );
          } else {
            const { preAllocatedStudentId } = await project.get();
            if (preAllocatedStudentId) {
              await tx.studentProjectAllocation.deleteMany({
                where: {
                  userId: preAllocatedStudentId,
                  projectId: project.params.projectId,
                },
              });
            }
          }

          if (flagIds.length > 0) {
            await linkProjectFlagIds(tx, project.params, flagIds);
          }

          if (tagIds.length > 0) {
            await linkProjectTagIds(tx, project.params, tagIds);
          }
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

      if (await user.isStudent(instance.params)) {
        const student = await user.toStudent(instance.params);
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

  getByIdWithSupervisor: procedure.project.user
    .output(
      z.object({ project: projectDtoSchema, supervisor: supervisorDtoSchema }),
    )
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

      return {
        project: T.toProjectDTO(data),
        supervisor: T.toSupervisorDTO(data.supervisor),
      };
    }),

  // MOVE to ac
  // ok
  getUserAccess: procedure.project.user
    .output(
      z.discriminatedUnion("access", [
        z.object({ access: z.literal(true) }),
        z.object({ access: z.literal(false), error: z.string() }),
      ]),
    )
    .query(async ({ ctx: { user, instance, project } }) => {
      if (await user.isStaff(instance.params)) {
        return { access: true };
      } else if (await user.isStudent(instance.params)) {
        const student = await user.toStudent(instance.params);

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
            type: z.enum(PreferenceType).or(z.literal("SUBMITTED")),
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
  // BREAKING output type changed
  delete: procedure.project
    .inStage(previousStages(Stage.PROJECT_ALLOCATION))
    .withRoles([Role.ADMIN, Role.SUPERVISOR])
    .output(permissionResultSchema)
    .mutation(async ({ ctx: { project, user } }) => {
      if (await user.isSubGroupAdminOrBetter(project.params)) {
        await project.delete();
        return PermissionResult.OK;
      }

      if ((await project.get()).supervisorId === user.id) {
        await project.delete();
        return PermissionResult.OK;
      }

      return PermissionResult.UNAUTHORISED;
    }),

  // ok
  // BREAKING output type changed
  deleteSelected: procedure.instance
    .inStage(previousStages(Stage.PROJECT_ALLOCATION))
    .withRoles([Role.ADMIN, Role.SUPERVISOR])
    .input(z.object({ projectIds: z.array(z.string()) }))
    .output(z.array(permissionResultSchema))
    .mutation(async ({ ctx: { instance, user }, input: { projectIds } }) => {
      const isAdmin = await user.isSubGroupAdminOrBetter(instance.params);

      const checkedProjects = isAdmin
        ? projectIds.map((e) => ({ pid: e, res: true }))
        : await Promise.all(
            projectIds.map(async (e) => ({
              pid: e,
              res: await user.isProjectSupervisor(e),
            })),
          );

      await instance.deleteProjects(
        checkedProjects.filter(({ res }) => res).map(({ pid }) => pid),
      );

      return checkedProjects.map(({ res }) =>
        res ? PermissionResult.OK : PermissionResult.UNAUTHORISED,
      );
    }),

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
  create: procedure.instance
    .inStage([Stage.PROJECT_SUBMISSION, Stage.STUDENT_BIDDING])
    .withRoles([Role.ADMIN, Role.SUPERVISOR])
    .input(z.object({ newProject: projectForm.createApiInputSchema }))
    .output(z.string())
    .mutation(async ({ ctx: { instance, db }, input: { newProject } }) => {
      return await db.$transaction(async (tx) => {
        const project = await tx.project.create({
          data: {
            ...expand(instance.params),
            title: newProject.title,
            description: newProject.description,
            capacityLowerBound: 0,
            capacityUpperBound: newProject.capacityUpperBound,
            preAllocatedStudentId: newProject.preAllocatedStudentId ?? null,
            specialTechnicalRequirements:
              newProject.specialTechnicalRequirements ?? null,
            latestEditDateTime: new Date(),
            supervisorId: newProject.supervisorId,
          },
        });

        if (
          newProject.preAllocatedStudentId &&
          newProject.preAllocatedStudentId.trim() !== ""
        ) {
          // ! would just override another pre-allocated student - bad probably
          await linkPreAllocatedStudent(
            tx,
            { ...instance.params, projectId: project.id },
            newProject.preAllocatedStudentId,
          );
        }

        await linkProjectFlagIds(
          tx,
          { ...instance.params, projectId: project.id },
          newProject.flagIds,
        );

        await linkProjectTagIds(
          tx,
          { ...instance.params, projectId: project.id },
          newProject.tagIds,
        );

        return project.id;
      });
    }),

  getFormInitialisationData: procedure.instance.user
    .input(z.object({ projectId: z.string().optional() }))
    .output(
      z.object({
        takenTitles: z.set(z.string()),
        flags: z.array(flagDtoSchema),
        tags: z.array(tagDtoSchema),
        studentIds: z.array(z.string()),
        supervisorIds: z.array(z.string()),
      }),
    )
    .query(async ({ ctx: { instance, user }, input: { projectId } }) => {
      // make sure only students with the correct data are returned
      // (big asterisk considering you can change the flags on a project)
      // so instead get all unallocated students and filter them on the client based on the selected flags

      const allProjects = await instance.getProjectDetails();
      const takenTitles = new Set(allProjects.map(({ project: p }) => p.title));

      let studentIds = await instance
        .getUnallocatedStudents()
        .then((students) => students.map((s) => s.id));

      if (projectId) {
        const project = await instance.getProject(projectId).get();
        takenTitles.delete(project.title);

        // if the project has a pre-allocated student, we should allow them to be re-selected
        if (project.preAllocatedStudentId) {
          studentIds.push(project.preAllocatedStudentId);
        }
      }

      let supervisorIds: string[] = [];
      if (await user.isSubGroupAdminOrBetter(instance.params)) {
        const supervisors = await instance.getSupervisors();
        supervisorIds = supervisors.map((s) => s.id);
      }

      return {
        takenTitles,
        flags: await instance.getFlags(),
        tags: await instance.getTags(),
        studentIds,
        supervisorIds,
      };
    }),

  // ok
  getAllocation: procedure.project.user
    .output(
      z.object({ student: studentDtoSchema, rank: z.number() }).optional(),
    )
    .query(async ({ ctx: { project, db } }) => {
      const allocation = await db.studentProjectAllocation.findFirst({
        where: { projectId: project.params.projectId },
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

  supervisorSubmissionInfo: procedure.instance.subGroupAdmin
    .output(
      z.array(
        z.object({
          supervisor: supervisorDtoSchema,
          submittedProjectsCount: z.number(),
          allocatedCount: z.number(),
          submissionTarget: z.number(),
          targetMet: z.boolean(),
        }),
      ),
    )
    .query(
      async ({ ctx: { instance } }) =>
        await instance.getSupervisorSubmissionDetails(),
    ),
});

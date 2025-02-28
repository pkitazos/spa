import { PreferenceType, Stage } from "@prisma/client";
import { z } from "zod";

import { expand, toPP2 } from "@/lib/utils/general/instance-params";
import {
  getFlagFromStudentLevel,
  getStudentLevelFromFlag,
} from "@/lib/utils/permissions/get-student-level";
import {
  previousStages,
  subsequentStages,
} from "@/lib/utils/permissions/stage-check";
import { instanceParamsSchema } from "@/lib/validations/params";
import { updatedProjectSchema } from "@/lib/validations/project-form";
import { supervisorProjectSubmissionDetailsSchema } from "@/lib/validations/supervisor-project-submission-details";

import { procedure } from "@/server/middleware";
import { createTRPCRouter } from "@/server/trpc";

import { computeProjectSubmissionTarget } from "@/config/submission-target";
import { updateProjectAllocation } from "@/db/transactions/project-allocation";
import { linkProjectFlags } from "@/db/transactions/project-flags";
import { flagDtoSchema, tagDtoSchema, userDtoSchema } from "@/dto";
import { projectDtoSchema } from "@/dto/project";
import { Role } from "@/db/types";
import { studentDtoSchema } from "@/dto/student";
import { supervisorDtoSchema } from "@/dto/supervisor";
import { projectDataToDTO, studentToDTO } from "@/db/transformers";

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
        project.update(updatedProject);
        const newPreAllocatedStudentId = preAllocatedStudentId || undefined;

        await db.$transaction(async (tx) => {
          const oldProjectData = await tx.projectDetails.findFirstOrThrow({
            where: { id: project.params.projectId },
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

          await tx.projectDetails.update({
            where: { id: project.params.projectId },
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

  // ok
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
      const studentData = await student.getDetails();
      const preferences = await student.getAllDraftPreferences();

      const preferenceIds = new Set(
        preferences.map(({ project: { id } }) => id),
      );

      return projectData
        .filter(({ projectId, details: { flagsOnProject } }) => {
          if (preferenceIds.has(projectId)) return false;
          return flagsOnProject.some(({ flag }) =>
            studentData.flags.includes(flag),
          );
        })
        .map((p) => ({
          id: p.projectId,
          title: p.details.title,
          flags: p.details.flagsOnProject.map((f) => f.flag),
        }));
    }),

  // MOVE db
  getAllForUser: procedure.instance.user
    .input(z.object({ userId: z.string() }))
    .output(
      z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          description: z.string(),
          specialTechnicalRequirements: z.string(),
          supervisor: userDtoSchema,
          flags: z.array(flagDtoSchema),
          tags: z.array(tagDtoSchema),
          preAllocatedStudentId: z.string().optional(),
        }),
      ),
    )
    .query(async ({ ctx: { instance, db }, input: { userId } }) => {
      const projectData = await instance.getProjectDetails();
      await db.projectInInstance.findMany({
        where: expand(instance.params),
        include: {
          supervisor: {
            include: { userInInstance: { include: { user: true } } },
          },
          details: {
            include: {
              tagsOnProject: { include: { tag: true } },
              flagsOnProject: { include: { flag: true } },
            },
          },
        },
      });

      const allProjects = projectData.map(({ details, ...p }) => ({
        id: p.projectId,
        title: details.title,
        description: details.title,
        specialTechnicalRequirements:
          details.specialTechnicalRequirements ?? "",
        supervisor: p.supervisor.userInInstance.user,
        flags: details.flagsOnProject.map(({ flag }) => flag),
        tags: details.tagsOnProject.map(({ tag }) => tag),
        preAllocatedStudentId: details.preAllocatedStudentId ?? undefined,
      }));

      const student = await (await instance.getStudent(userId)).getDetails();
      await db.studentDetails.findFirst({
        where: { ...expand(instance.params), userId },
        select: {
          studentLevel: true,
          userInInstance: { select: { role: true } },
        },
      });

      if (!student) return allProjects;

      return allProjects.filter(({ flags, preAllocatedStudentId }) => {
        if (preAllocatedStudentId) return preAllocatedStudentId === userId;
        return flags.some(
          (f) => getStudentLevelFromFlag(f) === student.studentLevel,
        );
      });
    }),

  // TODO move db
  // ok
  getAllLateProposals: procedure.instance.subGroupAdmin
    .output(
      z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          supervisorId: z.string(),
          capacityUpperBound: z.number(),
          flags: z.array(flagDtoSchema),
        }),
      ),
    )
    .query(async ({ ctx: { instance, db } }) => {
      const { projectSubmissionDeadline } = await instance.get();

      const data = await db.projectInInstance.findMany({
        where: {
          ...expand(instance.params),
          details: { latestEditDateTime: { gt: projectSubmissionDeadline } },
        },
        include: {
          details: { include: { flagsOnProject: { select: { flag: true } } } },
        },
      });

      return data.map((p) => ({
        id: p.projectId,
        title: p.details.title,
        supervisorId: p.supervisorId,
        capacityUpperBound: p.details.capacityUpperBound,
        flags: p.details.flagsOnProject.map(({ flag }) => flag),
      }));
    }),

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
    .query(async ({ ctx, input: { params } }) => {
      const data = await ctx.db.projectInInstance.findFirstOrThrow({
        where: params,
        include: {
          supervisor: {
            include: { userInInstance: { include: { user: true } } },
          },
          details: {
            include: {
              flagsOnProject: { include: { flag: true } },
              tagsOnProject: { include: { tag: true } },
            },
          },
        },
      });

      return projectDataToDTO(data);
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

      const projects = await db.projectInInstance.findMany({
        where: {
          projectId,
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

  //getStudentPreferencesForId
  getAllStudentPreferences: procedure.project.user
    .output(
      z.array(
        z.object({
          student: studentDtoSchema,
          preference: z.object({
            type: z.nativeEnum(PreferenceType),
            rank: z.number(),
          }),
        }),
      ),
    )
    .query(async ({ ctx: { instance, project, db }, input: { projectId } }) => {
      const hello = await db.projectInInstance.findFirstOrThrow({
        where: toPP2(project.params),
        include: {
          inStudentDraftPreferences: {
            include: {
              student: {
                include: { userInInstance: { include: { user: true } } },
              },
            },
          },
          inStudentSubmittedPreferences: {
            include: {
              student: {
                include: { userInInstance: { include: { user: true } } },
              },
            },
          },
        },
      });

      const hello2 = hello.inStudentDraftPreferences.map((x) => x.student);

      const hello3 = hello.inStudentSubmittedPreferences.map((x) => x.student);
      // const studentData = await ctx.db.studentDraftPreference.findMany({
      //   where: { projectId },
      //   select: {
      //     student: {
      //       select: {
      //         user: { select: { id: true, name: true } },
      //         studentDetails: { select: { studentLevel: true } },
      //         studentPreferences: {
      //           select: { projectId: true, rank: true },
      //           orderBy: { rank: "asc" },
      //         },
      //       },
      //     },
      //     rank: true,
      //     type: true,
      //   },
      // });

      // return studentData
      //   .sort((a, b) => a.rank - b.rank)
      //   .sort(sortPreferenceType)
      //   .map(({ student, ...s }) => ({
      //     ...s,
      //     id: student.user.id,
      //     name: student.user.name,
      //     level: student.studentDetails[0].studentLevel,
      //     rank:
      //       student.studentPreferences
      //         .map((s) => s.projectId)
      //         .findIndex((p) => p === projectId) + 1,
      //   }));
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

  details: procedure.user
    .input(z.object({ params: instanceParamsSchema }))
    .query(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
        },
      }) => {
        const allFlags = await ctx.db.flag.findMany({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
          },
          select: { id: true, title: true, flagOnProjects: true },
        });

        const allTags = await ctx.db.tag.findMany({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
          },
          select: { id: true, title: true, tagOnProject: true },
        });

        return {
          flags: allFlags
            .filter((f) => f.flagOnProjects.length !== 0)
            .map((e) => ({ id: e.id, title: e.title })),
          tags: allTags
            .filter((t) => t.tagOnProject.length !== 0)
            .map((e) => ({ id: e.id, title: e.title })),
        };
      },
    ),

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
          const project = await tx.projectDetails.create({
            data: {
              title: newProject.title,
              description: newProject.description,
              capacityLowerBound: 0,
              capacityUpperBound: newProject.capacityUpperBound,
              preAllocatedStudentId: newProject.preAllocatedStudentId || null,
              specialTechnicalRequirements:
                newProject.specialTechnicalRequirements ?? null,
              latestEditDateTime: new Date(),
              projectInInstance: {
                create: { ...expand(instance.params), supervisorId },
              },
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

  getFormDetails: procedure.instance.user
    .input(
      z.object({
        params: instanceParamsSchema,
        projectId: z.string().optional(),
      }),
    )
    .query(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
          projectId,
        },
      }) => {
        const { flags, tags } =
          await ctx.db.allocationInstance.findFirstOrThrow({
            where: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              id: instance,
            },
            select: {
              flags: { select: { id: true, title: true } },
              tags: { select: { id: true, title: true } },
            },
          });

        // make sure only students with the correct data are returned

        const studentData = await ctx.db.userInInstance.findMany({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
            role: Role.STUDENT,
            studentAllocation: { is: null },
          },
          select: {
            studentDetails: { select: { userId: true, studentLevel: true } },
          },
        });

        let projectFlags: Set<string> = new Set();
        if (projectId) {
          const projectData = await ctx.db.flagOnProject.findMany({
            where: { projectId },
            select: { flag: true },
          });
          projectFlags = new Set(projectData.map(({ flag }) => flag.title));
        }

        const projectTitles = await ctx.db.project.findMany({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
          },
          select: { title: true },
        });

        const students = studentData
          .map(({ studentDetails }) => ({
            id: studentDetails[0].userId,
            studentLevel: studentDetails[0].studentLevel,
          }))
          .filter((s) =>
            projectId
              ? projectFlags.has(getFlagFromStudentLevel(s.studentLevel))
              : true,
          );

        return {
          takenTitles: projectTitles.map(({ title }) => title),
          flags,
          tags,
          students,
        };
      },
    ),

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
        student: studentToDTO(allocation.student),
        rank: allocation.studentRanking,
      };
    }),

  /**
   * Returns a list of details for supervisors containing:
   * - their personal details,
   * - their allocation target & count
   * - their
   */
  supervisorSubmissionInfo: procedure.instance.subGroupAdmin
    .output(
      z.array(
        supervisorProjectSubmissionDetailsSchema.extend({
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

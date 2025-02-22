/* eslint-disable simple-import-sort/imports */
import { Stage } from "@prisma/client";
import { z } from "zod";

import {
  getFlagFromStudentLevel,
  getStudentLevelFromFlag,
} from "@/lib/utils/permissions/get-student-level";
import {
  stageGte,
  subsequentStages,
} from "@/lib/utils/permissions/stage-check";
import { sortPreferenceType } from "@/lib/utils/preferences/sort";
import { User } from "@/lib/validations/auth";
import { instanceParamsSchema } from "@/lib/validations/params";
import { updatedProjectSchema } from "@/lib/validations/project-form";

import { updateProjectAllocation } from "@/server/routers/project/_utils/project-allocation";
import { createTRPCRouter } from "@/server/trpc";

import { expand, toInstanceId } from "@/lib/utils/general/instance-params";
import { procedure } from "@/server/middleware";
import { supervisorProjectSubmissionDetailsSchema } from "@/lib/validations/supervisor-project-submission-details";
import { computeProjectSubmissionTarget } from "@/config/submission-target";
import { flagDtoSchema, tagDtoSchema, userDtoSchema } from "@/dto";
import { linkProjectFlags } from "@/server/routers/project/_utils/project-flags";

export const projectRouter = createTRPCRouter({
  exists: procedure.project.user
    .output(z.boolean())
    .query(async ({ ctx: { project } }) => await project.exists()),

  // TODO rename? e.g. update?
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
                  projectId: project.params.projectId,
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

  // TODO move db
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
    .query(async ({ ctx: { instance, db }, input: { studentId } }) => {
      const projectData = await db.projectInInstance.findMany({
        where: {
          ...expand(instance.params),
          details: { preAllocatedStudentId: null },
        },
        include: {
          details: { include: { flagsOnProject: { include: { flag: true } } } },
        },
      });

      const allProjects = projectData.map((p) => ({
        id: p.projectId,
        title: p.details.title,
        flags: p.details.flagsOnProject.map(({ flag }) => flag),
      }));

      const student = await db.studentDetails.findFirstOrThrow({
        where: { ...expand(instance.params), userId: studentId },
        select: { studentLevel: true },
      });

      const preferences = await db.studentDraftPreference.findMany({
        where: { ...expand(instance.params), userId: studentId },
        select: { projectId: true },
      });

      const preferenceIds = new Set(
        preferences.map(({ projectId }) => projectId),
      );

      return allProjects.filter(({ id, flags }) => {
        if (preferenceIds.has(id)) return false;
        return flags.some(
          (f) => getStudentLevelFromFlag(f) === student.studentLevel,
        );
      });
    }),

  // TODO move db
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
      const projectData = await db.projectInInstance.findMany({
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

      const student = await ctx.db.studentDetails.findFirst({
        where: {
          allocationGroupId: params.group,
          allocationSubGroupId: params.subGroup,
          allocationInstanceId: params.instance,
          userId,
        },
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

  // TODO move db
  getAllPreAllocated: procedure.instance.user
    .output(
      z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          description: z.string(),
          specialTechnicalRequirements: z.string(),
          capacityLowerBound: z.number(),
          capacityUpperBound: z.number(),
          preAllocatedStudentId: z.string(),
          student: userDtoSchema,
          supervisor: userDtoSchema,
          latestEditDateTime: z.date(),
          tags: z.array(tagDtoSchema),
          flags: z.array(flagDtoSchema),
        }),
      ),
    )
    .query(async ({ ctx: { instance, db } }) => {
      return await db.$transaction(async (tx) => {
        const students = await tx.studentDetails
          .findMany({
            where: expand(instance.params),
            select: { userInInstance: { select: { user: true } } },
          })
          .then((data) =>
            data
              .map(({ userInInstance }) => userInInstance.user)
              .reduce(
                (acc, val) => {
                  acc[val.id] = val;
                  return acc;
                },
                {} as Record<string, User>,
              ),
          );

        const projects = await tx.projectInInstance.findMany({
          where: {
            ...expand(instance.params),
            details: { preAllocatedStudentId: { not: null } },
          },
          include: {
            supervisor: {
              include: { userInInstance: { include: { user: true } } },
            },
            details: {
              include: {
                tagsOnProject: { select: { tag: true } },
                flagsOnProject: { select: { flag: true } },
              },
            },
          },
        });

        return projects
          .filter((p) => p.details.preAllocatedStudentId !== null)
          .map((p) => ({
            id: p.projectId,
            title: p.details.title,
            description: p.details.description,
            specialTechnicalRequirements:
              p.details.specialTechnicalRequirements ?? "",
            capacityLowerBound: p.details.capacityLowerBound,
            capacityUpperBound: p.details.capacityUpperBound,
            latestEditDateTime: p.details.latestEditDateTime,
            preAllocatedStudentId: p.details.preAllocatedStudentId!,
            student: students[p.details.preAllocatedStudentId!]!,
            supervisor: p.supervisor.userInInstance.user,
            tags: p.details.tagsOnProject.map(({ tag }) => tag),
            flags: p.details.flagsOnProject.map(({ flag }) => flag),
          }));
      });
    }),

  // TODO move db
  getById: procedure.project.user.query(
    async ({ ctx, input: { projectId } }) => {
      const { supervisor, details } =
        await ctx.db.projectInInstance.findFirstOrThrow({
          where: { projectId },
          include: {
            supervisor: {
              include: { userInInstance: { include: { user: true } } },
            },
            details: {
              include: {
                flagsOnProject: {
                  select: { flag: { select: { id: true, title: true } } },
                },
                tagsOnProject: {
                  select: { tag: { select: { id: true, title: true } } },
                },
              },
            },
          },
        });

      return {
        title: details.title,
        description: details.description,
        supervisor: supervisor.userInInstance.user,
        capacityUpperBound: details.capacityUpperBound,
        preAllocatedStudentId: details.preAllocatedStudentId,
        specialTechnicalRequirements:
          details.specialTechnicalRequirements ?? "",
        flags: details.flagsOnProject.map(({ flag }) => flag),
        tags: details.tagsOnProject.map(({ tag }) => tag),
      };
    },
  ),

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
            toInstanceId(instance.params, parentInstanceId),
          ],
        },
      });

      return projects.length === 2;
    },
  ),

  // TODO: convert output to discriminated union

  getUserAccess: procedure.instance.user
    .input(z.object({ params: instanceParamsSchema, projectId: z.string() }))
    .query(async ({ ctx, input: { params, projectId } }) => {
      const user = ctx.session.user;

      const allowedRoles = new Set([Role.ADMIN, Role.SUPERVISOR]);
      if (user.roles.isSubsetOf(allowedRoles)) {
        return { access: true, studentFlagLabel: "" };
      }

      const { flagOnProjects, preAllocatedStudentId } =
        await ctx.db.project.findFirstOrThrow({
          where: {
            id: projectId,
            allocationGroupId: params.group,
            allocationSubGroupId: params.subGroup,
            allocationInstanceId: params.instance,
          },
          select: {
            preAllocatedStudentId: true,
            flagOnProjects: { select: { flag: true } },
          },
        });

      if (preAllocatedStudentId) {
        return {
          access: preAllocatedStudentId === user.id,
          studentFlagLabel: "",
        };
      }

      const student = await ctx.db.studentDetails.findFirst({
        where: {
          allocationGroupId: params.group,
          allocationSubGroupId: params.subGroup,
          allocationInstanceId: params.instance,
          userId: ctx.session.user.id,
        },
      });

      if (!student) return { access: true, studentFlagLabel: "" };

      const access = flagOnProjects.some(
        ({ flag }) => getStudentLevelFromFlag(flag) === student.studentLevel,
      );

      return {
        access,
        studentFlagLabel: getFlagFromStudentLevel(student.studentLevel),
      };
    }),

  getAllStudentPreferences: procedure.instance.user
    .input(z.object({ params: instanceParamsSchema, projectId: z.string() }))
    .query(async ({ ctx, input: { projectId } }) => {
      const studentData = await ctx.db.preference.findMany({
        where: { projectId },
        select: {
          student: {
            select: {
              user: { select: { id: true, name: true } },
              studentDetails: { select: { studentLevel: true } },
              studentPreferences: {
                select: { projectId: true, rank: true },
                orderBy: { rank: "asc" },
              },
            },
          },
          rank: true,
          type: true,
        },
      });

      return studentData
        .sort((a, b) => a.rank - b.rank)
        .sort(sortPreferenceType)
        .map(({ student, ...s }) => ({
          ...s,
          id: student.user.id,
          name: student.user.name,
          level: student.studentDetails[0].studentLevel, // TODO: move preference relation to studentDetails table
          rank:
            student.studentPreferences
              .map((s) => s.projectId)
              .findIndex((p) => p === projectId) + 1,
        }));
    }),

  delete: procedure.instance.user
    .input(z.object({ params: instanceParamsSchema, projectId: z.string() }))
    .mutation(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
          projectId,
        },
      }) => {
        if (stageGte(ctx.instance.stage, Stage.PROJECT_ALLOCATION)) return;

        await ctx.db.project.delete({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
            id: projectId,
          },
        });
      },
    ),

  deleteSelected: procedure.instance.user
    .input(
      z.object({
        params: instanceParamsSchema,
        projectIds: z.array(z.string()),
      }),
    )
    .mutation(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
          projectIds,
        },
      }) => {
        if (stageGte(ctx.instance.stage, Stage.PROJECT_ALLOCATION)) return;

        await ctx.db.project.deleteMany({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
            id: { in: projectIds },
          },
        });
      },
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
          select: {
            id: true,
            title: true,
            flagOnProjects: true,
          },
        });

        const allTags = await ctx.db.tag.findMany({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
          },
          select: {
            id: true,
            title: true,
            tagOnProject: true,
          },
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

  create: procedure.instance.user
    .input(
      z.object({
        params: instanceParamsSchema,
        newProject: updatedProjectSchema,
        supervisorId: z.string(),
      }),
    )
    .mutation(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
          supervisorId,
          newProject: {
            title,
            description,
            flagTitles,
            tags,
            capacityUpperBound,
            preAllocatedStudentId,
            specialTechnicalRequirements,
          },
        },
      }) => {
        if (stageGte(ctx.instance.stage, Stage.PROJECT_ALLOCATION)) return;

        await ctx.db.$transaction(async (tx) => {
          const project = await tx.project.create({
            data: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
              supervisorId: supervisorId,
              title,
              description,
              capacityLowerBound: 0,
              capacityUpperBound,
              preAllocatedStudentId,
              specialTechnicalRequirements,
              latestEditDateTime: new Date(),
            },
          });

          if (preAllocatedStudentId && preAllocatedStudentId !== "") {
            await updateProjectAllocation(tx, {
              group,
              subGroup,
              instance,
              preAllocatedStudentId,
              projectId: project.id,
            });
          }

          await linkProjectFlags(
            tx,
            ctx.instance.params,
            project.id,
            flagTitles,
          );

          const currentInstanceTags = await tx.tag.findMany({
            where: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
            },
          });

          const newInstanceTags = tags.filter((t) => {
            return !currentInstanceTags.map((e) => e.id).includes(t.id);
          });

          await tx.tag.createMany({
            data: newInstanceTags.map((tag) => ({
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
              ...tag,
            })),
          });

          await tx.tagOnProject.createMany({
            data: tags.map(({ id: tagId }) => ({
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

  getAllocation: procedure.instance.user
    .input(z.object({ params: instanceParamsSchema, projectId: z.string() }))
    .query(async ({ ctx, input: { projectId } }) => {
      const allocation = await ctx.db.projectAllocation.findFirst({
        where: { projectId },
        select: { student: { select: { user: true } }, studentRanking: true },
      });

      const student = allocation?.student?.user ?? undefined;
      const rank = allocation?.studentRanking ?? undefined;

      if (student && rank) return { ...student, rank };
      return undefined;
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

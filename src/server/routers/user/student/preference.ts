import { PreferenceType, Role, Stage } from "@prisma/client";
import { z } from "zod";

import { stageGte, stageIn } from "@/lib/utils/permissions/stage-check";
import { sortPreferenceType } from "@/lib/utils/preferences/sort";
import { instanceParamsSchema } from "@/lib/validations/params";
import { studentPreferenceSchema } from "@/lib/validations/student-preference";

import {
  createTRPCRouter,
  instanceAdminProcedure,
  instanceProcedure,
  MultiRoleAwareContext,
  multiRoleAwareProcedure,
  roleAwareProcedure,
  studentProcedure,
} from "@/server/trpc";

import { getSelfDefinedProject } from "../_utils/get-self-defined-project";
import { getStudent } from "../_utils/get-student";

import { getBoardState } from "./_utils/get-board-state";
import { updateManyPreferenceTransaction } from "./_utils/update-many-preferences";
import { updatePreferenceTransaction } from "./_utils/update-preference";

export const preferenceRouter = createTRPCRouter({
  getAll: instanceAdminProcedure
    .input(
      z.object({
        params: instanceParamsSchema,
        studentId: z.string(),
      }),
    )
    .query(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
          studentId,
        },
      }) => {
        const studentProjectPreferenceDetails =
          await ctx.db.preference.findMany({
            where: {
              allocationGroupId: group,
              allocationInstanceId: instance,
              allocationSubGroupId: subGroup,
              userId: studentId,
            },
            select: {
              type: true,
              rank: true,
              project: {
                select: {
                  title: true,
                  id: true,
                  supervisor: {
                    select: { user: { select: { name: true, id: true } } },
                  },
                },
              },
            },
            orderBy: { rank: "asc" },
          });

        return studentProjectPreferenceDetails
          .sort(sortPreferenceType)
          .map(({ project, type }, i) => ({
            project: { id: project.id, title: project.title },
            supervisor: {
              name: project.supervisor.user.name!,
              id: project.supervisor.user.id,
            },
            type: type,
            rank: type === PreferenceType.PREFERENCE ? i + 1 : NaN,
          }));
      },
    ),

  getAllSaved: instanceProcedure
    .input(z.object({ params: instanceParamsSchema, studentId: z.string() }))
    .query(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
          studentId,
        },
      }) => {
        const { preferences } = await ctx.db.studentDetails.findFirstOrThrow({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
            userId: studentId,
          },
          select: {
            preferences: {
              select: {
                project: {
                  include: {
                    supervisor: {
                      select: { user: { select: { id: true, name: true } } },
                    },
                  },
                },
                rank: true,
              },
              orderBy: { rank: "asc" },
            },
          },
        });

        return preferences.map(({ project, rank }) => ({
          id: project.id,
          title: project.title,
          supervisor: {
            id: project.supervisor.user.id,
            name: project.supervisor.user.name!,
          },
          rank,
        }));
      },
    ),

  getByProject: roleAwareProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
        },
      }) => {
        const role = ctx.session.user.role;

        if (role !== Role.STUDENT) return new Map<string, PreferenceType>();

        const student = await ctx.db.studentDetails.findFirstOrThrow({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
            userId: ctx.session.user.id,
          },
          select: {
            userInInstance: {
              select: {
                studentPreferences: { select: { projectId: true, type: true } },
              },
            },
          },
        });

        const preferenceByProject = new Map<string, PreferenceType>();

        student.userInInstance.studentPreferences.forEach(
          ({ projectId, type }) => {
            preferenceByProject.set(projectId, type);
          },
        );

        return preferenceByProject;
      },
    ),

  makeUpdate: multiRoleAwareProcedure
    .input(
      z.object({
        params: instanceParamsSchema,
        studentId: z.string(),
        projectId: z.string(),
        preferenceType: studentPreferenceSchema,
      }),
    )
    .mutation(
      async ({
        ctx,
        input: { params, studentId, projectId, preferenceType },
      }) => {
        const { ok, message } = accessControl({
          ctx,
          allowedRoles: [Role.ADMIN, Role.STUDENT],
          stageCheck: (s) => s === Stage.STUDENT_BIDDING,
        });
        if (!ok) throw new Error(message);

        const selfDefinedProject = await getSelfDefinedProject(
          ctx.db,
          params,
          studentId,
        );
        if (selfDefinedProject) {
          throw new Error("Student has self-defined a project");
        }

        const student = await getStudent(ctx.db, params, studentId);

        await updatePreferenceTransaction({
          db: ctx.db,
          student,
          params,
          projectId,
          preferenceType,
        });

        const { projects } = await getBoardState(ctx.db, params, studentId);
        return projects;
      },
    ),

  update: studentProcedure
    .input(
      z.object({
        params: instanceParamsSchema,
        projectId: z.string(),
        preferenceType: studentPreferenceSchema,
      }),
    )
    .mutation(async ({ ctx, input: { params, projectId, preferenceType } }) => {
      if (ctx.instance.stage !== Stage.STUDENT_BIDDING) return;
      const student = ctx.session.user;
      const selfDefinedProject = await getSelfDefinedProject(
        ctx.db,
        params,
        student.id,
      );
      if (selfDefinedProject) return;

      await updatePreferenceTransaction({
        db: ctx.db,
        student,
        params,
        projectId,
        preferenceType,
      });
    }),

  updateSelected: studentProcedure
    .input(
      z.object({
        params: instanceParamsSchema,
        projectIds: z.array(z.string()),
        preferenceType: studentPreferenceSchema,
      }),
    )
    .mutation(
      async ({ ctx, input: { params, projectIds, preferenceType } }) => {
        if (ctx.instance.stage !== Stage.STUDENT_BIDDING) return;
        const student = ctx.session.user;
        const selfDefinedProject = await getSelfDefinedProject(
          ctx.db,
          params,
          student.id,
        );
        if (selfDefinedProject) return;

        await updateManyPreferenceTransaction({
          db: ctx.db,
          student,
          params,
          projectIds,
          preferenceType,
        });
      },
    ),

  makeReorder: multiRoleAwareProcedure
    .input(
      z.object({
        params: instanceParamsSchema,
        studentId: z.string(),
        projectId: z.string(),
        preferenceType: z.nativeEnum(PreferenceType),
        updatedRank: z.number(),
      }),
    )
    .mutation(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
          studentId,
          projectId,
          preferenceType,
          updatedRank,
        },
      }) => {
        const { ok, message } = accessControl({
          ctx,
          allowedRoles: [Role.ADMIN, Role.STUDENT],
          stageCheck: (s) => s === Stage.STUDENT_BIDDING,
        });
        if (!ok) throw new Error(message);

        const selfDefinedProject = await getSelfDefinedProject(
          ctx.db,
          { group, subGroup, instance },
          studentId,
        );
        if (selfDefinedProject) return;

        await ctx.db.preference.update({
          where: {
            preferenceId: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
              projectId,
              userId: studentId,
            },
          },
          data: {
            type: preferenceType,
            rank: updatedRank,
          },
        });
      },
    ),

  reorder: studentProcedure
    .input(
      z.object({
        params: instanceParamsSchema,
        projectId: z.string(),
        preferenceType: z.nativeEnum(PreferenceType),
        updatedRank: z.number(),
      }),
    )
    .mutation(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
          projectId,
          preferenceType,
          updatedRank,
        },
      }) => {
        if (stageGte(ctx.instance.stage, Stage.PROJECT_ALLOCATION)) return;
        const student = ctx.session.user;
        const selfDefinedProject = await getSelfDefinedProject(
          ctx.db,
          { group, subGroup, instance },
          student.id,
        );
        if (selfDefinedProject) return;

        await ctx.db.preference.update({
          where: {
            preferenceId: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
              projectId,
              userId: ctx.session.user.id,
            },
          },
          data: {
            type: preferenceType,
            rank: updatedRank,
          },
        });
      },
    ),

  getForProject: instanceProcedure
    .input(
      z.object({
        params: instanceParamsSchema,
        projectId: z.string(),
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
        const preference = await ctx.db.preference.findFirst({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
            projectId,
            userId: ctx.session.user.id,
          },
          select: { type: true },
        });

        return preference ? preference.type : "None";
      },
    ),

  /**
   * TODO: check all references
   */
  submit: multiRoleAwareProcedure
    .input(z.object({ params: instanceParamsSchema, studentId: z.string() }))
    .mutation(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
          studentId,
        },
      }) => {
        const { ok, message } = accessControl({
          ctx,
          allowedRoles: [Role.ADMIN, Role.STUDENT],
          stageCheck: (s) => s === Stage.STUDENT_BIDDING,
        });
        if (!ok) throw new Error(message);

        const selfDefinedProject = await getSelfDefinedProject(
          ctx.db,
          { group, subGroup, instance },
          studentId,
        );
        if (selfDefinedProject) return;

        const newSubmissionDateTime = new Date();

        await ctx.db.$transaction(async (tx) => {
          const preferences = await tx.preference.findMany({
            where: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
              userId: studentId,
              type: PreferenceType.PREFERENCE,
            },
            select: { projectId: true, rank: true },
            orderBy: { rank: "asc" },
          });

          await tx.savedPreference.deleteMany({
            where: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
              userId: studentId,
            },
          });

          await tx.savedPreference.createMany({
            data: preferences.map(({ projectId }, i) => ({
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
              projectId,
              rank: i + 1,
              userId: studentId,
            })),
          });

          await tx.studentDetails.update({
            where: {
              detailsId: {
                allocationGroupId: group,
                allocationSubGroupId: subGroup,
                allocationInstanceId: instance,
                userId: studentId,
              },
            },
            data: {
              submittedPreferences: true,
              latestSubmissionDateTime: newSubmissionDateTime,
            },
          });
        });

        return newSubmissionDateTime;
      },
    ),

  initialBoardState: multiRoleAwareProcedure
    .input(z.object({ params: instanceParamsSchema, studentId: z.string() }))
    .query(async ({ ctx, input: { params, studentId } }) => {
      const { ok, message } = accessControl({
        ctx,
        allowedRoles: [Role.ADMIN, Role.STUDENT],
        stageCheck: (s) =>
          stageIn(s, [Stage.STUDENT_BIDDING, Stage.ALLOCATION_ADJUSTMENT]),
      });
      if (!ok) throw new Error(message);

      const board = await getBoardState(ctx.db, params, studentId);
      return { initialProjects: board.projects };
    }),

  change: instanceAdminProcedure
    .input(
      z.object({
        params: instanceParamsSchema,
        studentId: z.string(),
        projectId: z.string(),
        newPreferenceType: studentPreferenceSchema,
      }),
    )
    .mutation(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
          studentId,
          projectId,
          newPreferenceType,
        },
      }) => {
        const { studentLevel } = await ctx.db.studentDetails.findFirstOrThrow({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
            userId: studentId,
          },
          select: { studentLevel: true },
        });

        await updatePreferenceTransaction({
          db: ctx.db,
          student: { id: studentId, studentLevel },
          params: { group, subGroup, instance },
          projectId,
          preferenceType: newPreferenceType,
        });
      },
    ),

  changeSelected: instanceAdminProcedure
    .input(
      z.object({
        params: instanceParamsSchema,
        studentId: z.string(),
        newPreferenceType: z.nativeEnum(PreferenceType).or(z.literal("None")),
        projectIds: z.array(z.string()),
      }),
    )
    .mutation(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
          studentId,
          newPreferenceType,
          projectIds,
        },
      }) => {
        const { studentLevel } = await ctx.db.studentDetails.findFirstOrThrow({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
            userId: studentId,
          },
          select: { studentLevel: true },
        });

        await updateManyPreferenceTransaction({
          db: ctx.db,
          student: { id: studentId, studentLevel },
          params: { group, subGroup, instance },
          projectIds,
          preferenceType: newPreferenceType,
        });
      },
    ),
});

function accessControl({
  ctx,
  allowedRoles,
  stageCheck,
}: {
  ctx: MultiRoleAwareContext;
  allowedRoles: Role[];
  stageCheck: (s: Stage) => boolean;
}) {
  const user = ctx.session.user;
  const roleOk = user.roles.isSubsetOf(new Set(allowedRoles));

  if (!roleOk) {
    return {
      ok: false,
      message: `User ${user.id} does not have permission to access this resource, as ${Array.from(user.roles)} does not sufficiently overlap with ${allowedRoles}.`,
    };
  }

  const stageOk = stageCheck(ctx.instance.stage);
  if (!stageOk) {
    return {
      ok: false,
      message: `User ${user.id} cannot access this resource at this stage.`,
    };
  }

  return { ok: true, message: "User can access this resource." };
}

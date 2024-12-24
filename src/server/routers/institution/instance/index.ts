import { Stage } from "@prisma/client";
import { TRPCClientError } from "@trpc/client";
import { z } from "zod";

import { formatParamsAsPath } from "@/lib/utils/general/get-instance-path";
import { expand } from "@/lib/utils/general/instance-params";
import { setDiff } from "@/lib/utils/general/set-difference";
import {
  newStudentSchema,
  newSupervisorSchema,
} from "@/lib/validations/add-users/new-user";
import {
  forkedInstanceSchema,
  updatedInstanceSchema,
} from "@/lib/validations/instance-form";
import { instanceParamsSchema } from "@/lib/validations/params";
import { studentLevelSchema } from "@/lib/validations/student-level";
import { getTabs } from "@/lib/validations/tabs/side-panel";

import {
  createTRPCRouter,
  instanceAdminProcedure,
  instanceProcedure,
  multiRoleAwareProcedure,
  protectedProcedure,
} from "@/server/trpc";
import { validateEmailGUIDMatch } from "@/server/utils/id-email-check";
import { getUserRole } from "@/server/utils/instance/user-role";

import { hasSelfDefinedProject } from "../../user/_utils/get-self-defined-project";

import { addStudentsTx } from "./_utils/add-students-transaction";
import { addSupervisorsTx } from "./_utils/add-supervisors-transaction";
import { forkInstanceTransaction } from "./_utils/fork/transaction";
import { mergeInstanceTrx } from "./_utils/merge/transaction";
import { getPreAllocatedStudents } from "./_utils/pre-allocated-students";
import { algorithmRouter } from "./algorithm";
import { externalSystemRouter } from "./external";
import { matchingRouter } from "./matching";
import { preferenceRouter } from "./preference";
import { projectRouter } from "./project";

import { pages } from "@/content/pages";
import {
  createSupervisorDetails,
  findSupervisorDetails,
} from "@/data-access/supervisor-details";
import { createUserInInstance, deleteUserInInstance } from "@/data-access/user";
import { Role } from "@/db";
import {
  checkInstanceExists,
  getEditFormDetails,
  getFlagTitles,
  getInstance,
  getProjectAllocations,
  getSelectedAlgorithm,
  getStudents,
  getSupervisorDetails,
  getSupervisors,
  updateStage,
} from "@/interactors/instance";

// TODO: add stage checks to stage-specific procedures
export const instanceRouter = createTRPCRouter({
  matching: matchingRouter,
  algorithm: algorithmRouter,
  project: projectRouter,
  external: externalSystemRouter,
  preference: preferenceRouter,

  exists: protectedProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(async ({ input: { params } }) => {
      return checkInstanceExists({ params });
    }),

  get: protectedProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(async ({ input: { params } }) => {
      return await getInstance({ params });
    }),

  currentStage: instanceProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(async ({ ctx }) => {
      return ctx.instance.stage;
    }),

  setStage: instanceAdminProcedure
    .input(
      z.object({
        params: instanceParamsSchema,
        stage: z.nativeEnum(Stage),
      }),
    )
    .mutation(async ({ input: { params, stage } }) => {
      await updateStage({ params, stage });
    }),

  selectedAlgorithm: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(async ({ ctx, input: { params } }) => {
      return await getSelectedAlgorithm({
        params,
        selectedAlgName: ctx.instance.selectedAlgName,
      });
    }),

  projectAllocations: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(async ({ input: { params } }) => {
      return await getProjectAllocations({ params });
    }),

  getEditFormDetails: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(async ({ input: { params } }) => {
      return await getEditFormDetails({ params });
    }),

  supervisors: instanceProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(async ({ input: { params } }) => {
      return await getSupervisors({ params });
    }),

  students: instanceProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(async ({ input: { params } }) => {
      return await getStudents({ params });
    }),

  getSupervisors: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(async ({ input: { params } }) => {
      return await getSupervisorDetails({ params });
    }),

  addSupervisor: instanceAdminProcedure
    .input(
      z.object({
        params: instanceParamsSchema,
        newSupervisor: newSupervisorSchema,
      }),
    )
    .mutation(
      async ({
        ctx,
        input: {
          params,
          newSupervisor: {
            institutionId,
            fullName,
            email,
            projectTarget,
            projectUpperQuota,
          },
        },
      }) => {
        // ! this breaks unless I can pass the Prisma Transaction Client
        await ctx.db.$transaction(async (tx) => {
          const exists = await findSupervisorDetails(params, institutionId);
          if (exists) throw new TRPCClientError("User is already a supervisor");

          await validateEmailGUIDMatch(tx, institutionId, email, fullName);

          await createUserInInstance(params, institutionId);

          await createSupervisorDetails(params, institutionId, {
            projectAllocationLowerBound: 0,
            projectAllocationTarget: projectTarget,
            projectAllocationUpperBound: projectUpperQuota,
          });
        });

        return {
          institutionId,
          fullName,
          email,
          projectTarget,
          projectUpperQuota,
        };
      },
    ),

  addSupervisors: instanceAdminProcedure
    .input(
      z.object({
        params: instanceParamsSchema,
        newSupervisors: z.array(newSupervisorSchema),
      }),
    )
    .mutation(async ({ ctx, input: { params, newSupervisors } }) => {
      return await addSupervisorsTx(ctx.db, newSupervisors, params);
    }),

  removeSupervisor: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema, supervisorId: z.string() }))
    .mutation(async ({ input: { params, supervisorId } }) => {
      await deleteUserInInstance(params, supervisorId);
    }),

  removeSupervisors: instanceAdminProcedure
    .input(
      z.object({
        params: instanceParamsSchema,
        supervisorIds: z.array(z.string()),
      }),
    )
    .mutation(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
          supervisorIds,
        },
      }) => {
        await ctx.db.userInInstance.deleteMany({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
            userId: { in: supervisorIds },
          },
        });
      },
    ),

  invitedSupervisors: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
        },
      }) => {
        const invitedUsers = await ctx.db.userInInstance.findMany({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
          },
          select: { user: true, joined: true },
        });

        return {
          supervisors: invitedUsers.map(({ user, joined }) => ({
            id: user.id,
            name: user.name!,
            email: user.email!,
            joined,
          })),
        };
      },
    ),

  getStudents: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
        },
      }) => {
        const students = await ctx.db.studentDetails.findMany({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
          },
          select: {
            userInInstance: { select: { user: true } },
            studentLevel: true,
          },
        });

        return students.map(({ userInInstance: { user }, studentLevel }) => ({
          institutionId: user.id,
          fullName: user.name!,
          email: user.email!,
          level: studentLevelSchema.parse(studentLevel),
        }));
      },
    ),

  addStudent: instanceAdminProcedure
    .input(
      z.object({
        params: instanceParamsSchema,
        newStudent: newStudentSchema,
      }),
    )
    .mutation(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
          newStudent: { institutionId, fullName, email, level },
        },
      }) => {
        await ctx.db.$transaction(async (tx) => {
          const exists = await tx.studentDetails.findFirst({
            where: {
              userId: institutionId,
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
            },
          });
          if (exists) throw new TRPCClientError("User is already a student");

          await validateEmailGUIDMatch(tx, institutionId, email, fullName);

          await tx.userInInstance.create({
            data: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
              userId: institutionId,
            },
          });

          await tx.studentDetails.create({
            data: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
              userId: institutionId,
              studentLevel: level,
            },
          });
        });
        return { institutionId, fullName, email, level };
      },
    ),

  addStudents: instanceAdminProcedure
    .input(
      z.object({
        params: instanceParamsSchema,
        newStudents: z.array(newStudentSchema),
      }),
    )
    .mutation(async ({ ctx, input: { params, newStudents } }) => {
      return await addStudentsTx(ctx.db, newStudents, params);
    }),

  removeStudent: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema, studentId: z.string() }))
    .mutation(async ({ ctx, input: { params, studentId } }) => {
      await ctx.db.$transaction(async (tx) => {
        const project = await tx.projectInInstance.findFirst({
          where: {
            ...expand(params),
            details: { preAllocatedStudentId: studentId },
          },
        });

        if (project) {
          await tx.projectDetails.update({
            where: { id: project.projectId },
            data: { preAllocatedStudentId: null },
          });
        }

        await tx.userInInstance.delete({
          where: {
            instanceMembership: {
              ...expand(params),
              userId: studentId,
            },
          },
        });
      });
    }),

  removeStudents: instanceAdminProcedure
    .input(
      z.object({
        params: instanceParamsSchema,
        studentIds: z.array(z.string()),
      }),
    )
    .mutation(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
          studentIds,
        },
      }) => {
        await ctx.db.$transaction(async (tx) => {
          const projects = await tx.projectInInstance.findMany({
            where: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
              details: { preAllocatedStudentId: { in: studentIds } },
            },
          });

          if (projects.length > 0) {
            await tx.projectDetails.updateMany({
              where: { id: { in: projects.map((p) => p.projectId) } },
              data: { preAllocatedStudentId: null },
            });
          }

          await tx.userInInstance.deleteMany({
            where: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
              userId: { in: studentIds },
            },
          });
        });
      },
    ),

  invitedStudents: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
        },
      }) => {
        const invitedStudents = await ctx.db.studentDetails.findMany({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
          },
          select: {
            userInInstance: { include: { user: true } },
            studentLevel: true,
          },
        });

        const preAllocatedStudents = await getPreAllocatedStudents(ctx.db, {
          group,
          subGroup,
          instance,
        });

        const all = invitedStudents.map(({ userInInstance, studentLevel }) => ({
          id: userInInstance.user.id,
          name: userInInstance.user.name,
          email: userInInstance.user.email,
          joined: userInInstance.joined,
          level: studentLevel,
          preAllocated: preAllocatedStudents.has(userInInstance.user.id),
        }));

        return {
          all,
          incomplete: all.filter((s) => !s.joined && !s.preAllocated),
          preAllocated: all.filter((s) => s.preAllocated),
        };
      },
    ),

  edit: instanceAdminProcedure
    .input(
      z.object({
        params: instanceParamsSchema,
        updatedInstance: updatedInstanceSchema,
      }),
    )
    .mutation(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
          updatedInstance: { flags, tags, ...updatedData },
        },
      }) => {
        await ctx.db.$transaction(async (tx) => {
          await tx.allocationInstance.update({
            where: {
              instanceId: {
                allocationGroupId: group,
                allocationSubGroupId: subGroup,
                id: instance,
              },
            },
            data: updatedData,
          });

          const currentInstanceFlags = await tx.flag.findMany({
            where: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
            },
          });

          const newInstanceFlags = setDiff(
            flags,
            currentInstanceFlags,
            (a) => a.title,
          );
          const staleInstanceFlags = setDiff(
            currentInstanceFlags,
            flags,
            (a) => a.title,
          );

          await tx.flag.deleteMany({
            where: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
              title: { in: staleInstanceFlags.map((f) => f.title) },
            },
          });

          await tx.flag.createMany({
            data: newInstanceFlags.map((f) => ({
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
              title: f.title,
              description: "",
            })),
          });

          const currentInstanceTags = await tx.tag.findMany({
            where: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
            },
          });

          const newInstanceTags = setDiff(
            tags,
            currentInstanceTags,
            (a) => a.title,
          );
          const staleInstanceTags = setDiff(
            currentInstanceTags,
            tags,
            (a) => a.title,
          );

          await tx.tag.deleteMany({
            where: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
              title: { in: staleInstanceTags.map((t) => t.title) },
            },
          });

          await tx.tag.createMany({
            data: newInstanceTags.map((t) => ({
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
              title: t.title,
            })),
          });
        });
      },
    ),

  getHeaderTabs: protectedProcedure
    .input(z.object({ params: instanceParamsSchema.partial() }))
    .query(async ({ ctx, input }) => {
      const result = instanceParamsSchema.safeParse(input.params);
      if (!result.success) return { headerTabs: [], instancePath: "" };

      const params = result.data;

      const instance = await getInstance({ params });
      const role = await getUserRole(ctx.db, params, ctx.session.user.id);
      const instancePath = formatParamsAsPath(params);

      const adminTabs = [pages.allSupervisors, pages.allStudents];

      if (role !== Role.ADMIN) {
        return {
          headerTabs: [pages.instanceHome, pages.allProjects],
          instancePath,
        };
      }

      const headerTabs =
        instance.stage === Stage.SETUP
          ? [pages.instanceHome, ...adminTabs]
          : [pages.instanceHome, pages.allProjects, ...adminTabs];

      return { headerTabs, instancePath };
    }),

  getSidePanelTabs: multiRoleAwareProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(async ({ ctx, input: { params } }) => {
      const user = ctx.session.user;

      const forkedInstanceId = await ctx.db.allocationInstance.findFirst({
        where: {
          allocationGroupId: params.group,
          allocationSubGroupId: params.subGroup,
          parentInstanceId: params.instance,
        },
      });

      const instance = {
        ...ctx.instance,
        forkedInstanceId: forkedInstanceId?.id ?? null,
      };

      const preAllocatedProject = await hasSelfDefinedProject(
        ctx.db,
        params,
        user,
        user.roles,
      );

      const tabs = getTabs({
        roles: user.roles,
        instance,
        preAllocatedProject,
      });
      return tabs;
    }),

  fork: instanceAdminProcedure
    .input(
      z.object({
        params: instanceParamsSchema,
        newInstance: forkedInstanceSchema,
      }),
    )
    .mutation(async ({ ctx, input: { params, newInstance: forked } }) => {
      if (ctx.instance.stage !== Stage.ALLOCATION_PUBLICATION) {
        // TODO: throw error instead of returning
        return;
      }
      await forkInstanceTransaction(ctx.db, forked, params);
    }),

  merge: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .mutation(async ({ ctx, input: { params } }) => {
      await mergeInstanceTrx(ctx.db, params);
    }),

  getFlags: instanceProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(async ({ input: { params } }) => {
      return await getFlagTitles({ params });
    }),
});

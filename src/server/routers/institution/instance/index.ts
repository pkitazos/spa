import { Stage } from "@prisma/client";
import { z } from "zod";

import { formatParamsAsPath } from "@/lib/utils/general/get-instance-path";
import {
  newStudentSchema,
  newSupervisorSchema,
} from "@/lib/validations/add-users/new-user";
import {
  forkedInstanceSchema,
  updatedInstanceSchema,
} from "@/lib/validations/instance-form";
import { instanceParamsSchema } from "@/lib/validations/params";
import { getTabs } from "@/lib/validations/tabs/side-panel";

import {
  createTRPCRouter,
  instanceAdminProcedure,
  instanceProcedure,
  multiRoleAwareProcedure,
  protectedProcedure,
} from "@/server/trpc";
import { getUserRole } from "@/server/utils/instance/user-role";

import { hasSelfDefinedProject } from "../../user/_utils/get-self-defined-project";

import { addStudentTx } from "./_utils/add-student-transaction";
import { addStudentsTx } from "./_utils/add-students-transaction";
import { addSupervisorTx } from "./_utils/add-supervisor-transaction";
import { addSupervisorsTx } from "./_utils/add-supervisors-transaction";
import { editInstanceTx } from "./_utils/edit-instance-tx";
import { forkInstanceTransaction } from "./_utils/fork/transaction";
import { mergeInstanceTrx } from "./_utils/merge/transaction";
import { getPreAllocatedStudents } from "./_utils/pre-allocated-students";
import { removeStudentTx } from "./_utils/remove-student-transaction";
import { removeStudentsTx } from "./_utils/remove-students-tx";
import { algorithmRouter } from "./algorithm";
import { externalSystemRouter } from "./external";
import { matchingRouter } from "./matching";
import { preferenceRouter } from "./preference";
import { projectRouter } from "./project";

import { pages } from "@/content/pages";
import { getStudentDetailsWithUser } from "@/data-access/student-details";
import { deleteUsersInInstance } from "@/data-access/user";
import { Role } from "@/db";
import {
  allStudentsUseCase,
  checkInstanceExistsUseCase,
  getEditFormDetailsUseCase,
  getFlagTitlesUseCase,
  getInstanceUseCase,
  getProjectAllocationsUseCase,
  getSelectedAlgorithmUseCase,
  getStudentsUseCase,
  getSupervisorDetailsUseCase,
  getSupervisorsUseCase,
  invitedStudentsUseCase,
  invitedSupervisorsUseCase,
  removeSupervisorsUseCase,
  removeSupervisorUseCase,
  updateStageUseCase,
} from "@/interactors";

// TODO: add stage checks to stage-specific procedures
export const instanceRouter = createTRPCRouter({
  matching: matchingRouter,
  algorithm: algorithmRouter,
  project: projectRouter,
  external: externalSystemRouter,
  preference: preferenceRouter,

  exists: instanceProcedure.query(
    async ({
      ctx: {
        instance: { params },
      },
    }) => {
      return checkInstanceExistsUseCase({ params });
    },
  ),

  get: instanceProcedure.query(async ({ input: { params } }) => {
    return await getInstanceUseCase({ params });
  }),

  currentStage: instanceProcedure.query(async ({ ctx }) => {
    return ctx.instance.stage;
  }),

  setStage: instanceAdminProcedure
    .input(
      z.object({
        stage: z.nativeEnum(Stage),
      }),
    )
    .mutation(async ({ input: { stage }, ctx }) => {
      await updateStageUseCase({ params: ctx.instance.params, stage });
    }),

  selectedAlgorithm: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(async ({ ctx, input: { params } }) => {
      return await getSelectedAlgorithmUseCase({
        params,
        selectedAlgName: ctx.instance.selectedAlgName,
      });
    }),

  projectAllocations: instanceAdminProcedure.query(async ({ ctx }) => {
    // return await ctx.instance.getAllocationData().getViews();
    return await getProjectAllocationsUseCase({ params: ctx.instance.params });
  }),

  getEditFormDetails: instanceAdminProcedure.query(async ({ ctx }) => {
    return await getEditFormDetailsUseCase({ params: ctx.instance.params });
  }),

  supervisors: instanceProcedure.query(async ({ input: { params } }) => {
    return await getSupervisorsUseCase({ params });
  }),

  students: instanceProcedure.query(async ({ input: { params } }) => {
    return await allStudentsUseCase({ params });
  }),

  getSupervisors: instanceAdminProcedure.query(async ({ ctx }) => {
    return await getSupervisorDetailsUseCase({ params: ctx.instance.params });
  }),

  addSupervisor: instanceAdminProcedure
    .input(z.object({ newSupervisor: newSupervisorSchema }))
    .mutation(async ({ ctx, input: { newSupervisor } }) => {
      return await addSupervisorTx(ctx.db, newSupervisor, ctx.instance.params);
    }),

  addSupervisors: instanceAdminProcedure
    .input(z.object({ newSupervisors: z.array(newSupervisorSchema) }))
    .mutation(async ({ ctx, input: { newSupervisors } }) => {
      return await addSupervisorsTx(
        ctx.db,
        newSupervisors,
        ctx.instance.params,
      );
    }),

  removeSupervisor: instanceAdminProcedure
    .input(z.object({ supervisorId: z.string() }))
    .mutation(async ({ ctx, input: { supervisorId } }) => {
      await removeSupervisorUseCase({
        params: ctx.instance.params,
        supervisorId,
      });
    }),

  removeSupervisors: instanceAdminProcedure
    .input(z.object({ supervisorIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input: { supervisorIds } }) => {
      await removeSupervisorsUseCase(
        { deleteUsersInInstance },
        { params: ctx.instance.params, supervisorIds },
      );
    }),

  invitedSupervisors: instanceAdminProcedure.query(
    async ({ ctx: { db, instance } }) => {
      return await invitedSupervisorsUseCase(
        { db, getStudentDetailsWithUser },
        { params: instance.params },
      );
    },
  ),

  getStudents: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(async ({ ctx: { db }, input: { params } }) => {
      return await getStudentsUseCase(
        { db, getStudentDetailsWithUser },
        { params },
      );
    }),

  addStudent: instanceAdminProcedure
    .input(
      z.object({
        params: instanceParamsSchema,
        newStudent: newStudentSchema,
      }),
    )
    .mutation(async ({ ctx, input: { params, newStudent } }) => {
      return await addStudentTx(ctx.db, newStudent, params);
    }),

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
      await removeStudentTx(ctx.db, studentId, params);
    }),

  removeStudents: instanceAdminProcedure
    .input(
      z.object({
        params: instanceParamsSchema,
        studentIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input: { params, studentIds } }) => {
      await removeStudentsTx(ctx.db, studentIds, params);
    }),

  invitedStudents: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(async ({ ctx: { db }, input: { params } }) => {
      return await invitedStudentsUseCase(
        { db, getStudentDetailsWithUser, getPreAllocatedStudents },
        { params },
      );
    }),

  edit: instanceAdminProcedure
    .input(
      z.object({
        params: instanceParamsSchema,
        updatedInstance: updatedInstanceSchema,
      }),
    )
    .mutation(async ({ ctx, input: { params, updatedInstance } }) => {
      await editInstanceTx(ctx.db, updatedInstance, params);
    }),

  getHeaderTabs: protectedProcedure
    .input(z.object({ params: instanceParamsSchema.partial() }))
    .query(async ({ ctx, input }) => {
      const result = instanceParamsSchema.safeParse(input.params);
      if (!result.success) return { headerTabs: [], instancePath: "" };

      const params = result.data;

      const instance = await getInstanceUseCase({ params });
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

  getFlags: instanceProcedure.query(async ({ input: { params } }) => {
    return await getFlagTitlesUseCase({ params });
  }),
});

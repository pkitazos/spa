import { z } from "zod";

import { relativeComplement } from "@/lib/utils/general/set-difference";
import { permissionCheck } from "@/lib/utils/permissions/permission-check";
import { validatedSegmentsSchema } from "@/lib/validations/breadcrumbs";
import { instanceParamsSchema } from "@/lib/validations/params";
import { instanceDisplayDataSchema } from "@/lib/validations/spaces";

import { procedure } from "@/server/middleware";
import {
  createTRPCRouter,
  multiRoleAwareProcedure,
  publicProcedure,
  roleAwareProcedure,
} from "@/server/trpc";

import { getDisplayNameMap } from "./_utils/instance";
import { validateSegments } from "./_utils/user-breadcrumbs";
import { studentRouter } from "./student";
import { supervisorRouter } from "./supervisor";

import { AllocationInstance } from "@/data-objects/spaces/instance";
import { User } from "@/data-objects/users/user";
import { userDtoSchema } from "@/dto";

export const userRouter = createTRPCRouter({
  student: studentRouter,
  supervisor: supervisorRouter,

  get: procedure.user
    .output(userDtoSchema)
    .query(async ({ ctx }) => await ctx.user.toDTO()),

  getById: procedure.user
    .input(z.object({ userId: z.string() }))
    .output(userDtoSchema)
    .query(
      async ({ ctx: { dal }, input: { userId } }) =>
        await new User(dal, userId).toDTO(),
    ),

  // TODO refactor
  role: roleAwareProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(async ({ ctx }) => ctx.session.user.role),

  // TODO refactor
  roles: multiRoleAwareProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(async ({ ctx }) => ctx.session.user.roles),

  hasSelfDefinedProject: procedure.instance.user
    .output(z.boolean())
    .query(async ({ ctx: { user, instance } }) => {
      if (!user.isInstanceStudent(instance.params)) return false;
      return user.toInstanceStudent(instance.params).hasSelfDefinedProject();
    }),

  // TODO refactor
  // TODO: replace with new implementation that returns list of admin panels
  getAdminPanel: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session || !ctx.session.user) return;

    const user = ctx.session.user;

    const adminSpaces = await ctx.db.adminInSpace.findMany({
      where: { userId: user.id },
      select: {
        adminLevel: true,
        allocationGroupId: true,
        allocationSubGroupId: true,
      },
    });

    if (adminSpaces.length === 0) return;

    const highestLevel = adminSpaces
      .sort((a, b) => (permissionCheck(a.adminLevel, b.adminLevel) ? 1 : 0))
      .at(0);

    if (!highestLevel) return;

    const {
      adminLevel,
      allocationGroupId: group,
      allocationSubGroupId: subGroup,
    } = highestLevel;

    // TODO: breaks if user is admin in multiple groups and/or subgroups

    if (adminLevel === "SUPER") return "/admin";
    if (adminLevel === "GROUP") return `/${group}`;
    if (adminLevel === "SUB_GROUP") return `/${group}/${subGroup}`;

    return;
  }),

  // TODO refactor
  instances: procedure.user
    .output(z.array(instanceDisplayDataSchema))
    .query(async ({ ctx }) => {
      const { user, dal } = ctx;
      const getDisplayData = await getDisplayNameMap(ctx.db);

      // if the user is a super-admin return all instances
      if (user.isSuperAdmin()) {
        const allInstances = await dal.instance.getAll();
        return allInstances.map((e) =>
          getDisplayData({
            group: e.allocationGroupId,
            subGroup: e.allocationSubGroupId,
            instance: e.id,
          }),
        );
      }

      // can safely assert that the user is not a super-admin

      // user is an admin in these spaces
      const groups = await dal.groupAdmin.getAllGroups(user.id);
      const subGroups = await dal.subGroupAdmin.getAllSubgroups(user.id);

      const uniqueSubGroups = relativeComplement(
        subGroups,
        groups,
        (a, b) => a.group == b.group,
      );

      const privilegedInstances = await dal.instance.getAllFrom(
        groups,
        uniqueSubGroups,
      );

      // user has some role in these instances (student or supervisor or reader)
      const unprivilegedInstances = await dal.user.getAllInstances(user.id);

      const uniqueUnprivileged = relativeComplement(
        unprivilegedInstances,
        privilegedInstances,
        AllocationInstance.eq,
      );

      const allInstances = [...privilegedInstances, ...uniqueUnprivileged];
      return allInstances.map(getDisplayData);
    }),

  breadcrumbs: publicProcedure
    .input(z.object({ segments: z.array(z.string()) }))
    .output(z.array(validatedSegmentsSchema))
    .query(async ({ ctx, input }) => {
      if (!ctx.session || !ctx.session.user) return [];
      const user = ctx.session.user;
      return await validateSegments(ctx.db, input.segments, user.id);
    }),

  joinInstance: procedure.instance.user.mutation(
    async ({ ctx: { user, instance } }) => {
      await user.joinInstance(instance.params);
    },
  ),
});

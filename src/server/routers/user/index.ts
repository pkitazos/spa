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
      return await user
        .toInstanceStudent(instance.params)
        .then((student) => student.hasSelfDefinedProject());
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
      if (await user.isSuperAdmin()) {
        const allInstances = await dal.instance.getAll();
        return allInstances.map(getDisplayData);
      }

      // can safely assert that the user is not a super-admin

      // user is an admin in these spaces
      const groups = await dal.groupAdmin.getAllGroups(user.id);

      const groupAdminInstances = await dal.instance.getForGroups(groups);

      const subGroups = await dal.subGroupAdmin.getAllSubgroups(user.id);

      const uniqueSubGroups = relativeComplement(
        subGroups,
        groups,
        (a, b) => a.group == b.group,
      );

      const subGroupAdminInstances =
        await dal.instance.getForGroups(uniqueSubGroups);

      const privilegedInstances = [
        ...groupAdminInstances,
        ...subGroupAdminInstances,
      ];

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

  breadcrumbs: procedure.user
    .input(z.object({ segments: z.array(z.string()) }))
    .output(z.array(validatedSegmentsSchema))
    .query(async ({ ctx: { user }, input: { segments } }) => {
      // TODO
      // This is fine as is, but I'd ask two things:
      // 1. why is it "user.breadcrumbs"?
      // 2. should the logic below live somewhere else?
      const [group, subGroup, instance, projectId] = segments;
      const res = [];
      if (group) {
        res.push({
          segment: group,
          access: await user.isGroupAdminOrBetter({ group }),
        });
      }
      if (subGroup) {
        res.push({
          segment: subGroup,
          access: await user.isSubGroupAdminOrBetter({ group, subGroup }),
        });
      }
      if (instance) {
        res.push({
          segment: instance,
          access: await user.isInstanceMember({ group, subGroup, instance }),
        });
      }
      if (projectId) {
        res.push({
          segment: projectId,
          access: await user.canAccessProject({
            group,
            subGroup,
            instance,
            projectId,
          }),
        });
      }
      return res;
    }),

  joinInstance: procedure.instance.user.mutation(
    async ({ ctx: { user, instance } }) => {
      await user.joinInstance(instance.params);
    },
  ),
});

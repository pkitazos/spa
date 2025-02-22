import { AdminLevel, Role } from "@prisma/client";
import { z } from "zod";

import {
  GroupParams,
  instanceParamsSchema,
  refinedSpaceParamsSchema,
  SubGroupParams,
} from "@/lib/validations/params";

import { procedure } from "@/server/middleware";
import {
  createTRPCRouter,
  instanceProcedure,
  protectedProcedure,
  roleAwareProcedure,
} from "@/server/trpc";
import { checkAdminPermissions } from "@/server/utils/admin/access";
import { isSuperAdmin } from "@/server/utils/admin/is-super-admin";
import { dispatchBySpace } from "@/server/utils/space/dispatch";
import { partitionSpaces } from "@/server/utils/space/partition";

import { getGroupDisplayNames, getSubGroupDisplayNames } from "./_utils/space";

import { studentStages, supervisorStages } from "@/dto";

export const accessControlRouter = createTRPCRouter({
  allAdminPanels: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.session.user;

    const superAdmin = await isSuperAdmin(ctx.db, user.id);
    if (superAdmin) return [{ title: "Admin", href: "/admin" }];

    const adminPanels = await ctx.db.adminInSpace.findMany({
      where: { userId: ctx.session.user.id },
    });

    const { groups, subGroups } = partitionSpaces(adminPanels);

    const getGroupName = await getGroupDisplayNames(ctx.db);
    const getSubGroupName = await getSubGroupDisplayNames(ctx.db);

    const groupRoutes = groups.map((p) => ({
      title: getGroupName(p),
      href: `/${p.group}`,
    }));

    const subGroupRoutes = subGroups.map((p) => ({
      title: `${getSubGroupName(p)}  (${getGroupName(p)})`,
      href: `/${p.group}/${p.subGroup}`,
    }));

    return [...groupRoutes, ...subGroupRoutes];
  }),

  adminInInstance: procedure.instance.user
    .output(z.boolean())
    .query(
      async ({ ctx: { user, instance } }) =>
        await user.isSubGroupAdminOrBetter(instance.params),
    ),

  getAdminLevelInSpace: procedure.user
    .input(z.object({ params: refinedSpaceParamsSchema }))
    .query(async ({ ctx: { dal }, input: { params } }) => {
      const superAdmin = await isSuperAdmin(ctx.db, user.id);
      if (superAdmin) return AdminLevel.SUPER;

      async function getGroupAdminLevel(p: GroupParams) {
        const { adminLevel } = await ctx.db.adminInSpace.findFirstOrThrow({
          where: {
            userId: user.id,
            allocationGroupId: p.group,
            allocationSubGroupId: null,
          },
          select: { adminLevel: true },
        });
        return adminLevel; // this will probably always be AdminLevel.GROUP
      }

      async function getSubGroupAdminLevel(p: SubGroupParams) {
        const groupAdmin = await ctx.db.adminInSpace.findFirst({
          where: {
            userId: user.id,
            allocationGroupId: p.group,
            allocationSubGroupId: null,
          },
          select: { adminLevel: true },
        });
        if (groupAdmin) return groupAdmin.adminLevel; // this will probably always be AdminLevel.GROUP

        const { adminLevel } = await ctx.db.adminInSpace.findFirstOrThrow({
          where: {
            userId: user.id,
            allocationGroupId: p.group,
            allocationSubGroupId: p.subGroup,
          },
          select: { adminLevel: true },
        });
        return adminLevel; // this will probably always be AdminLevel.SUB_GROUP
      }

      const adminLevel = await dispatchBySpace(
        params,
        getGroupAdminLevel,
        getSubGroupAdminLevel,
        getSubGroupAdminLevel,
      );

      return adminLevel;
    }),

  /**
   * Checks if the current user has access to a specific instance.
   *
   * @description
   * This procedure first verifies if the user possesses the necessary admin privileges to access the instance.
   * If not an admin, it then checks if the user is directly associated with the instance in the database.
   *
   */
  memberAccess: procedure.instance.user
    .input(z.object({ params: instanceParamsSchema }))
    .output(z.boolean())
    .query(async ({ ctx, input: { params } }) => {
      const adminExists = await checkAdminPermissions(
        ctx.db,
        params,
        ctx.session.user.id,
      );
      if (adminExists) return true;

      const userInInstance = await ctx.db.userInInstance.findFirst({
        where: {
          userId: ctx.session.user.id,
          allocationGroupId: params.group,
          allocationSubGroupId: params.subGroup,
          allocationInstanceId: params.instance,
        },
      });

      return !!userInInstance;
    }),

  stageAccess: roleAwareProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(async ({ ctx }) => {
      const user = ctx.session.user;
      const stage = ctx.instance.stage;

      if (user.role === Role.ADMIN) return true;

      if (user.role === Role.SUPERVISOR) {
        return !supervisorStages.includes(stage);
      }

      if (user.role === Role.STUDENT) {
        return !studentStages.includes(stage);
      }
    }),

  instanceRoles: instanceProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
        },
      }) => {
        const user = ctx.session.user;

        // user can only have one role in this table (student or supervisor)
        const { role } = await ctx.db.userInInstance.findFirstOrThrow({
          where: {
            userId: user.id,
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
          },
          select: { role: true },
        });

        console.log(role);

        // we now need to check if they are also an admin in this instance somehow
        // i.e are they an admin in the subGroup or group that this instance belongs to (or are they a super admin)
        // this is something I feel I'll be doing quite often so let's extract this out to a function

        // in fact before I go writing another function let's write out a plan of how I might test this
        // and then go through all of the existing admin access functions that I have lying around

        // I will create a test-page in an instance
        // I will then run some procedures on that page that will each print whether or not I am an admin in that instance
      },
    ),
});

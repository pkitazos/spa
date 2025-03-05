import { z } from "zod";

import { relativeComplement } from "@/lib/utils/general/set-difference";
import {
  instanceParamsSchema,
  refinedSpaceParamsSchema,
} from "@/lib/validations/params";

import { procedure } from "@/server/middleware";
import { createTRPCRouter } from "@/server/trpc";

import { AdminLevel } from "@/db/types";
import { adminLevelSchema } from "@/db/types";
import { readerStages, studentStages, supervisorStages } from "@/dto";

export const accessControlRouter = createTRPCRouter({
  allAdminPanels: procedure.user.query(async ({ ctx: { user } }) => {
    if (await user.isSuperAdmin()) return [{ title: "Admin", href: "/admin" }];

    const allGroups = await user.getManagedGroups();
    const allSubGroups = await user.getManagedSubGroups();

    const uniqueSubGroups = relativeComplement(
      allSubGroups,
      allGroups,
      (sg, g) => sg.path.startsWith(g.path),
    );

    return [...allGroups, ...uniqueSubGroups];
  }),

  adminInInstance: procedure.instance.user
    .output(z.boolean())
    .query(
      async ({ ctx: { user, instance } }) =>
        await user.isSubGroupAdminOrBetter(instance.params),
    ),

  getAdminLevelInSpace: procedure.user
    .input(z.object({ params: refinedSpaceParamsSchema }))
    .output(adminLevelSchema)
    .query(
      async ({
        ctx: { user },
        input: {
          params: { group, subGroup },
        },
      }) => {
        if (await user.isSuperAdmin()) return AdminLevel.SUPER;

        if (await user.isGroupAdmin({ group })) return AdminLevel.GROUP;

        if (subGroup && (await user.isSubGroupAdmin({ group, subGroup }))) {
          return AdminLevel.SUB_GROUP;
        }

        return AdminLevel.NONE;
      },
    ),

  /**
   * Checks if the current user has access to a specific instance.
   *
   * @description
   * This procedure first verifies if the user possesses the necessary admin privileges to access the instance.
   * If not an admin, it then checks if the user is directly associated with the instance in the database.
   *
   */
  instanceMembership: procedure.instance.user
    .input(z.object({ params: instanceParamsSchema }))
    .output(z.boolean())
    .query(
      async ({ ctx: { instance, user } }) =>
        await user.isMember(instance.params),
    ),

  stageAccess: procedure.instance.user
    .output(z.boolean())
    .query(async ({ ctx: { user, instance } }) => {
      if (await user.isSubGroupAdminOrBetter(instance.params)) return true;

      const { stage } = await instance.get();
      if (await user.isSupervisor(instance.params)) {
        return !supervisorStages.includes(stage);
      }

      if (await user.isReader(instance.params)) {
        return !readerStages.includes(stage);
      }

      if (await user.isStudent(instance.params)) {
        return !studentStages.includes(stage);
      }

      return false;
    }),
});

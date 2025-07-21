import { env } from "@/env";
import { z } from "zod";

import { readerStages, studentStages, supervisorStages } from "@/config/stages";

import { AdminLevel } from "@/db/types";
import { adminLevelSchema } from "@/db/types";

import { procedure } from "@/server/middleware";
import { createTRPCRouter } from "@/server/trpc";

import {
  instanceParamsSchema,
  refinedSpaceParamsSchema,
} from "@/lib/validations/params";

export const accessControlRouter = createTRPCRouter({
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

  breadcrumbs: procedure.user
    .input(z.object({ segments: z.array(z.string()) }))
    .output(z.array(z.object({ segment: z.string(), access: z.boolean() })))
    .query(
      async ({ ctx: { user }, input: { segments } }) =>
        await user.authoriseBreadcrumbs(segments),
    ),

  whitelisted: procedure.user
    .output(z.boolean())
    .query(async ({ ctx: { user } }) => {
      const { email } = await user.toDTO();

      return env.AMPS_WHITELISTED_USERS.toLowerCase()
        .split(";")
        .includes(email);
    }),
});

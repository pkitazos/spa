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

  projectAccess: procedure.project.user
    .output(
      z.discriminatedUnion("access", [
        z.object({ access: z.literal(true) }),
        z.object({ access: z.literal(false), error: z.string() }),
      ]),
    )
    .query(async ({ ctx: { user, instance, project } }) => {
      if (await user.isStaff(instance.params)) {
        return { access: true };
      }

      if (await user.isStudent(instance.params)) {
        const student = await user.toStudent(instance.params);

        const { flag: studentFlag } = await student.get();

        const projectFlags = await project.getFlags();

        if (projectFlags.map((f) => f.id).includes(studentFlag.id)) {
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

  breadcrumbs: procedure.user
    .input(z.object({ segments: z.array(z.string()) }))
    .output(z.array(z.object({ segment: z.string(), access: z.boolean() })))
    .query(
      async ({ ctx: { user }, input: { segments } }) =>
        await user.authoriseBreadcrumbs(segments),
    ),
});

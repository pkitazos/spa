import { AdminLevel } from "@prisma/client";
import { TRPCClientError } from "@trpc/client";
import { z } from "zod";

import { newAdminSchema } from "@/lib/validations/add-admins/new-admin";
import { createdInstanceSchema } from "@/lib/validations/instance-form";
import { subGroupParamsSchema } from "@/lib/validations/params";

import { procedure } from "@/server/middleware";
import { adminProcedure, createTRPCRouter } from "@/server/trpc";
import { isSubGroupAdmin } from "@/server/utils/admin/is-sub-group-admin";
import { validateEmailGUIDMatch } from "@/server/utils/id-email-check";

import { subGroupDtoSchema } from "@/dto";

export const subGroupRouter = createTRPCRouter({
  exists: procedure.subgroup.user
    .output(z.boolean())
    .query(async ({ ctx: { subGroup } }) => await subGroup.exists()),

  get: procedure.subgroup.user
    .output(subGroupDtoSchema)
    .query(async ({ ctx: { subGroup } }) => await subGroup.get()),

  access: procedure.subgroup.user
    .output(z.boolean())
    .query(
      async ({ ctx: { subGroup, user } }) =>
        await user.isSubGroupAdminOrBetter(subGroup.params),
    ),

  // TODO split
  // TODO rename
  instanceManagement: procedure.subgroup.subgroupAdmin.query(
    async ({ ctx: { subGroup } }) => {
      const { displayName } = await subGroup.get();
      const allocationInstances = await subGroup.getInstances();

      // TODO think this is right...
      const subGroupAdmins = await subGroup.getAdmins();

      return { displayName, allocationInstances, subGroupAdmins };
    },
  ),

  // TODO return a set
  takenInstanceNames: procedure.subgroup.subgroupAdmin
    .output(z.array(z.string()))
    .query(
      async ({ ctx: { subGroup } }) =>
        await subGroup
          .getInstances()
          .then((data) => data.map((instance) => instance.displayName)),
    ),

  createInstance: procedure.subgroup.subgroupAdmin
    .input(z.object({ newInstance: createdInstanceSchema }))
    .output(z.void())
    .mutation(
      async ({ ctx: { subGroup }, input: { newInstance } }) =>
        await subGroup.createInstance(newInstance),
    ),

  deleteInstance: procedure.instance.subgroupAdmin
    .output(z.void())
    .mutation(async ({ ctx: { instance } }) => await instance.delete()),

  // TODO: refactor after auth is implemented
  /**
   * Handles the form submission to add a new admin to a specified Sub-Group.
   *
   * @description
   * 1. Checks if the user (identified by `institutionId`) is already an admin in the specified Sub-Group.
   *    - If so, throws a `TRPCClientError` with the message "User is already an admin".
   *
   * 2. If the user is not already an admin:
   *    - Attempts to find the user in the database based on `institutionId` and `email`.
   *    - If the user is not found:
   *      - Tries to create a new user with the provided `institutionId`, `name`, and `email`.
   *      - If the user creation fails (e.g., due to a GUID/email mismatch), throws a `TRPCClientError` with the message "GUID and email do not match".
   *
   * 3. Finally, if the user exists (either found or newly created):
   *    - Creates an `adminInSpace` record associating the user with the specified Sub-Group and admin level.
   *
   * @throws {TRPCClientError} If the user is already an admin or if there's a GUID/email mismatch during user creation.
   */
  addAdmin: adminProcedure
    .input(
      z.object({
        params: subGroupParamsSchema,
        newAdmin: newAdminSchema,
      }),
    )
    .mutation(
      async ({
        ctx,
        input: {
          params: { group, subGroup },
          newAdmin: { institutionId, name, email },
        },
      }) => {
        await ctx.db.$transaction(async (tx) => {
          const exists = await isSubGroupAdmin(
            tx,
            { group, subGroup },
            institutionId,
          );
          if (exists) throw new TRPCClientError("User is already an admin");

          const user = await validateEmailGUIDMatch(
            tx,
            institutionId,
            email,
            name,
          );

          await tx.adminInSpace.create({
            data: {
              userId: user.id,
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              adminLevel: AdminLevel.SUB_GROUP,
            },
          });
        });
      },
    ),

  removeAdmin: adminProcedure
    .input(z.object({ params: subGroupParamsSchema, userId: z.string() }))
    .mutation(
      async ({
        ctx,
        input: {
          params: { group, subGroup },
          userId,
        },
      }) => {
        const { systemId } = await ctx.db.adminInSpace.findFirstOrThrow({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            userId,
          },
        });

        await ctx.db.adminInSpace.delete({
          where: { systemId },
        });
      },
    ),
});

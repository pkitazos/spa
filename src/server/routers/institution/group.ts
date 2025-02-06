import { TRPCClientError } from "@trpc/client";
import { z } from "zod";

import { newAdminSchema } from "@/lib/validations/add-admins/new-admin";
import { groupParamsSchema } from "@/lib/validations/params";

import { procedure } from "@/server/middleware";
import { adminProcedure, createTRPCRouter } from "@/server/trpc";
import { isGroupAdmin } from "@/server/utils/admin/is-group-admin";
import { validateEmailGUIDMatch } from "@/server/utils/id-email-check";

import { groupDtoSchema, subGroupDtoSchema, userDtoSchema } from "@/dto";

export const groupRouter = createTRPCRouter({
  exists: procedure.group.user
    .output(z.boolean())
    .query(async ({ ctx: { group } }) => await group.exists()),

  get: procedure.group.user
    .output(groupDtoSchema)
    .query(async ({ ctx: { group } }) => await group.get()),

  /**
   * returns true if the current user can access the specified group?
   * TODO move
   */
  access: procedure.group.user
    .output(z.boolean())
    .query(
      async ({ ctx: { user, group } }) =>
        await user.isGroupAdminOrBetter(group.params),
    ),

  subGroups: procedure.group.groupAdmin
    .output(z.array(subGroupDtoSchema))
    .query(async ({ ctx: { group } }) => await group.getSubGroups()),

  groupAdmins: procedure.group.groupAdmin
    .output(z.array(userDtoSchema))
    .query(async ({ ctx: { group } }) => await group.getAdmins()),

  takenSubGroupNames: procedure.group.groupAdmin
    .output(z.set(z.string()))
    .query(
      async ({ ctx: { group } }) =>
        await group
          .getSubGroups()
          .then((data) => new Set(data.map((x) => x.displayName))),
    ),

  createSubGroup: procedure.group.groupAdmin
    .input(z.object({ name: z.string() }))
    .output(subGroupDtoSchema)
    .mutation(async ({ ctx: { group }, input: { name } }) =>
      group.createSubGroup(name),
    ),

  deleteSubGroup: procedure.subgroup.groupAdmin
    .output(z.void())
    .mutation(async ({ ctx: { subGroup } }) => {
      await subGroup.delete();
    }),

  // TODO: refactor after auth is implemented
  /**
   * Handles the form submission to add a new admin to a specified Group.
   *
   * @description
   * 1. Checks if the user (identified by `institutionId`) is already an admin in the specified Group.
   *    - If so, throws a `TRPCClientError` with the message "User is already an admin".
   *
   * 2. If the user is not already an admin:
   *    - Attempts to find the user in the database based on `institutionId` and `email`.
   *    - If the user is not found:
   *      - Tries to create a new user with the provided `institutionId`, `name`, and `email`.
   *      - If the user creation fails (e.g., due to a GUID/email mismatch), throws a `TRPCClientError` with the message "GUID and email do not match".
   *
   * 3. Finally, if the user exists (either found or newly created):
   *    - Creates an `adminInSpace` record associating the user with the specified Group and admin level.
   *
   * @throws {TRPCClientError} If the user is already an admin or if there's a GUID/email mismatch during user creation.
   */
  addAdmin: adminProcedure
    .input(
      z.object({
        params: groupParamsSchema,
        newAdmin: newAdminSchema,
      }),
    )
    .output(z.void())
    .mutation(
      async ({
        ctx,
        input: {
          params,
          newAdmin: { institutionId, name, email },
        },
      }) => {
        await ctx.db.$transaction(async (tx) => {
          const exists = await isGroupAdmin(tx, params, institutionId);
          if (exists) throw new TRPCClientError("User is already an admin");

          const user = await validateEmailGUIDMatch(
            tx,
            institutionId,
            email,
            name,
          );

          await tx.groupAdmin.create({
            data: { userId: user.id, allocationGroupId: params.group },
          });
        });
      },
    ),

  removeAdmin: procedure.superAdmin
    .input(z.object({ params: groupParamsSchema, userId: z.string() }))
    .output(z.void())
    .mutation(async ({ ctx, input: { params, userId } }) => {
      await ctx.db.groupAdmin.delete({
        where: { groupAdminId: { allocationGroupId: params.group, userId } },
      });
    }),
});

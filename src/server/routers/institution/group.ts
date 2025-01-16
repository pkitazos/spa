import { AdminLevel } from "@prisma/client";
import { TRPCClientError } from "@trpc/client";
import { z } from "zod";

import { slugify } from "@/lib/utils/general/slugify";
import { newAdminSchema } from "@/lib/validations/add-admins/new-admin";
import {
  groupParamsSchema,
  subGroupParamsSchema,
} from "@/lib/validations/params";

import { procedure } from "@/server/middleware";
import { adminProcedure, createTRPCRouter } from "@/server/trpc";
import { isGroupAdmin } from "@/server/utils/admin/is-group-admin";
import { validateEmailGUIDMatch } from "@/server/utils/id-email-check";

import { groupDtoSchema } from "../user/dto";

export const groupRouter = createTRPCRouter({
  exists: procedure.group.user
    .output(z.boolean())
    .query(async ({ ctx: { group } }) => await group.exists()),

  get: procedure.group.user
    .output(groupDtoSchema)
    .query(async ({ ctx: { group } }) => await group.get()),

  // TODO rename
  /**
   * returns true if the current user can access the specified group
   */
  access: procedure.group.user
    .output(z.boolean())
    .query(
      async ({ ctx: { user, group } }) =>
        (await user.isSuperAdmin()) || (await user.isGroupAdmin(group.params)),
    ),

  // TODO rename
  /**
   * return a list of all managers for this group
   * @pkitazos need u to clarify this one i think
   */
  subGroupManagement: adminProcedure
    .input(z.object({ params: groupParamsSchema }))
    .query(
      async ({
        ctx,
        input: {
          params: { group },
        },
      }) => {
        const { displayName, allocationSubGroups } =
          await ctx.db.allocationGroup.findFirstOrThrow({
            where: { id: group },
            select: { displayName: true, allocationSubGroups: true },
          });

        const data = await ctx.db.adminInSpace.findMany({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: null,
            adminLevel: AdminLevel.GROUP,
          },
          select: { user: { select: { id: true, name: true, email: true } } },
        });

        return {
          displayName,
          allocationSubGroups,
          groupAdmins: data.map(({ user }) => user),
        };
      },
    ),

  takenSubGroupNames: procedure.group.groupAdmin
    .output(z.array(z.string()))
    .query(
      async ({ ctx: { group } }) =>
        await group
          .getSubGroups()
          .then((data) => data.map((x) => x.displayName)),
    ),

  createSubGroup: adminProcedure
    .input(z.object({ params: groupParamsSchema, name: z.string() }))
    .output(z.void())
    .mutation(
      async ({
        ctx,
        input: {
          params: { group },
          name,
        },
      }) => {
        await ctx.db.allocationSubGroup.create({
          data: {
            displayName: name,
            id: slugify(name),
            allocationGroupId: group,
          },
        });
      },
    ),

  deleteSubGroup: adminProcedure
    .input(z.object({ params: subGroupParamsSchema }))
    .output(z.void())
    .mutation(
      async ({
        ctx,
        input: {
          params: { group, subGroup },
        },
      }) => {
        await ctx.db.allocationSubGroup.delete({
          where: {
            subGroupId: {
              allocationGroupId: group,
              id: subGroup,
            },
          },
        });
      },
    ),

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
    .mutation(
      async ({
        ctx,
        input: {
          params: { group },
          newAdmin: { institutionId, name, email },
        },
      }) => {
        await ctx.db.$transaction(async (tx) => {
          const exists = await isGroupAdmin(tx, { group }, institutionId);
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
              allocationSubGroupId: null,
              adminLevel: AdminLevel.GROUP,
            },
          });
        });
      },
    ),

  removeAdmin: adminProcedure
    .input(z.object({ params: groupParamsSchema, userId: z.string() }))
    .mutation(
      async ({
        ctx,
        input: {
          params: { group },
          userId,
        },
      }) => {
        const { systemId } = await ctx.db.adminInSpace.findFirstOrThrow({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: null,
            userId,
          },
        });

        await ctx.db.adminInSpace.delete({ where: { systemId } });
      },
    ),
});

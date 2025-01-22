import { AdminLevel } from "@prisma/client";
import { TRPCClientError } from "@trpc/client";
import { z } from "zod";

import { slugify } from "@/lib/utils/general/slugify";
import { newAdminSchema } from "@/lib/validations/add-admins/new-admin";
import { builtInAlgorithms } from "@/lib/validations/algorithm";
import { createdInstanceSchema } from "@/lib/validations/instance-form";
import {
  instanceParamsSchema,
  subGroupParamsSchema,
} from "@/lib/validations/params";

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

      const subGroupAdmins = await subGroup.getSubGroupAdmins();

      return { displayName, allocationInstances, subGroupAdmins };
    },
  ),

  // adminProcedure
  //   .input(z.object({ params: subGroupParamsSchema }))
  //   .query(
  //     async ({
  //       ctx,
  //       input: {
  //         params: { group, subGroup },
  //       },
  //     }) => {
  //       const { displayName, allocationInstances } =
  //         await ctx.db.allocationSubGroup.findFirstOrThrow({
  //           where: {
  //             allocationGroupId: group,
  //             id: subGroup,
  //           },
  //           select: {
  //             displayName: true,
  //             allocationInstances: true,
  //           },
  //         });

  //       const data = await ctx.db.adminInSpace.findMany({
  //         where: {
  //           allocationGroupId: group,
  //           allocationSubGroupId: subGroup,
  //         },
  //         select: { user: { select: { id: true, name: true, email: true } } },
  //       });

  //       return {
  //         displayName,
  //         allocationInstances,
  //         subGroupAdmins: data.map(({ user }) => user),
  //       };
  //     },
  //   ),

  // TODO return a set
  takenInstanceNames: adminProcedure
    .input(z.object({ params: subGroupParamsSchema }))
    .query(
      async ({
        ctx,
        input: {
          params: { group, subGroup },
        },
      }) => {
        const data = await ctx.db.allocationSubGroup.findFirstOrThrow({
          where: { allocationGroupId: group, id: subGroup },
          select: { allocationInstances: { select: { displayName: true } } },
        });
        return data.allocationInstances.map((item) => item.displayName);
      },
    ),

  createInstance: adminProcedure
    .input(
      z.object({
        params: subGroupParamsSchema,
        newInstance: createdInstanceSchema,
      }),
    )
    .mutation(
      async ({
        ctx,
        input: {
          params: { group, subGroup },
          newInstance: {
            instanceName,
            minPreferences,
            maxPreferences,
            maxPreferencesPerSupervisor,
            preferenceSubmissionDeadline,
            projectSubmissionDeadline,
            flags,
            tags,
          },
        },
      }) => {
        const instance = slugify(instanceName);

        await ctx.db.$transaction(async (tx) => {
          await tx.allocationInstance.create({
            data: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              id: instance,
              displayName: instanceName,
              minPreferences,
              maxPreferences,
              maxPreferencesPerSupervisor,
              preferenceSubmissionDeadline,
              projectSubmissionDeadline,
            },
          });

          await tx.flag.createMany({
            data: flags.map(({ title }) => ({
              title,
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
            })),
          });

          await tx.tag.createMany({
            data: tags.map(({ title }) => ({
              title,
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
            })),
          });

          await tx.algorithm.createMany({
            data: builtInAlgorithms.map((a) => ({
              ...a,
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
              matchingResultData: JSON.stringify({}),
            })),
          });
        });
      },
    ),

  deleteInstance: adminProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .mutation(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
        },
      }) => {
        await ctx.db.allocationInstance.delete({
          where: {
            instanceId: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              id: instance,
            },
          },
        });
      },
    ),

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

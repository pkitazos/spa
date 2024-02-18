import { AdminLevel } from "@prisma/client";
import { z } from "zod";

import { slugify } from "@/lib/utils/general/slugify";
import {
  instanceParamsSchema,
  subGroupParamsSchema,
} from "@/lib/validations/params";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/server/trpc";
import { adminAccess } from "@/server/utils/admin-access";
import { isSuperAdmin } from "@/server/utils/is-super-admin";

export const subGroupRouter = createTRPCRouter({
  access: protectedProcedure
    .input(z.object({ params: subGroupParamsSchema }))
    .query(
      async ({
        ctx,
        input: {
          params: { group, subGroup },
        },
      }) => {
        const user = ctx.session.user;

        const groupAdmin = await ctx.db.adminInSpace.findFirst({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: null,
            userId: user.id,
          },
        });
        if (groupAdmin) return true;

        const subGroupAdmin = await ctx.db.adminInSpace.findFirst({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            userId: user.id,
          },
        });
        return !!subGroupAdmin;
      },
    ),

  instanceManagement: adminProcedure
    .input(z.object({ params: subGroupParamsSchema }))
    .query(
      async ({
        ctx,
        input: {
          params: { group, subGroup },
        },
      }) => {
        const userId = ctx.session.user.id;
        const data = await ctx.db.allocationSubGroup.findFirstOrThrow({
          where: {
            allocationGroupId: group,
            id: subGroup,
          },
          select: {
            displayName: true,
            allocationInstances: true,
            subGroupAdmins: {
              select: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        });

        const superAdmin = await isSuperAdmin(ctx.db, userId);
        if (superAdmin) return { adminLevel: AdminLevel.SUPER, ...data };

        // TODO: fix admin access problem
        const { adminLevel } = await ctx.db.adminInSpace.findFirstOrThrow({
          where: {
            allocationGroupId: group,
            OR: [
              { allocationSubGroupId: subGroup },
              { allocationSubGroupId: null },
            ],
            userId: userId,
          },
          select: { adminLevel: true },
        });

        return { adminLevel, ...data };
      },
    ),

  takenNames: adminProcedure
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
        name: z.string(),
        minPreferences: z.number(),
        maxPreferences: z.number(),
        maxPreferencesPerSupervisor: z.number(),
        preferenceSubmissionDeadline: z.date(),
        projectSubmissionDeadline: z.date(),
        flags: z.array(z.object({ flag: z.string() })),
        tags: z.array(z.object({ tag: z.string() })),
      }),
    )
    .mutation(
      async ({
        ctx,
        input: {
          params: { group, subGroup },
          name,
          minPreferences,
          maxPreferences,
          maxPreferencesPerSupervisor,
          preferenceSubmissionDeadline,
          projectSubmissionDeadline,
          flags,
          tags,
        },
      }) => {
        const instance = slugify(name);
        await ctx.db.allocationInstance.create({
          data: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            id: instance,
            displayName: name,
            minPreferences,
            maxPreferences,
            maxPreferencesPerSupervisor,
            preferenceSubmissionDeadline,
            projectSubmissionDeadline,
          },
        });

        await ctx.db.flag.createMany({
          data: flags.map(({ flag }) => ({
            title: flag,
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
          })),
        });

        await ctx.db.tag.createMany({
          data: tags.map(({ tag }) => ({
            title: tag,
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
          })),
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

  addAdmin: adminProcedure
    .input(
      z.object({
        params: subGroupParamsSchema,
        schoolId: z.string(),
        name: z.string(),
        email: z.string(),
      }),
    )
    .mutation(
      async ({
        ctx,
        input: {
          params: { group, subGroup },
          schoolId,
          name,
          email,
        },
      }) => {
        /**
         * check if user is already an admin in this group
         *  -> do nothing
         *
         * if user exists but is not an admin in this group
         *  -> make them an admin in this group
         *
         * if the user does not exist
         *  -> invite them
         *  -> make them an admin in this group
         *
         * */

        const alreadyAdmin = await adminAccess(ctx.db, schoolId, { group });
        if (alreadyAdmin) return;

        let user = await ctx.db.user.findFirst({
          where: { id: schoolId },
        });

        if (!user) {
          // TODO: if user does not exist
          user = await ctx.db.user.create({
            data: { id: schoolId, name, email },
          });
          // -> add them to invitation list
          // -> send them an email
          // -> make them an admin in this group
        }

        await ctx.db.adminInSpace.create({
          data: {
            userId: user.id,
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            adminLevel: AdminLevel.GROUP,
          },
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

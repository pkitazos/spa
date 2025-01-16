import { z } from "zod";

import { createTRPCRouter } from "@/server/trpc";

import { AllocationGroup } from "@/data-objects/spaces/group";
import { groupDtoSchema, userDtoSchema } from "@/dto";
import { procedure } from "@/server/middleware";
import { groupRouter } from "./group";
import { instanceRouter } from "./instance";
import { subGroupRouter } from "./sub-group";

// TODO @pkitazos please review
export const institutionRouter = createTRPCRouter({
  group: groupRouter,
  subGroup: subGroupRouter,
  instance: instanceRouter,

  superAdminAccess: procedure.user
    .output(z.boolean())
    .query(async ({ ctx: { user } }) => await user.isSuperAdmin()),

  // slightly odd one
  // Consider splitting into two?
  // or perhaps just renaming? what does this really do?
  groupManagement: procedure.superAdmin
    // Best guess at output - need ur input @pkitazos
    .output(
      z.object({
        groups: z.array(groupDtoSchema),
        superAdmins: z.array(userDtoSchema),
      }),
    )
    .query(async ({ ctx: { dal } }) => {
      const groups = await dal.group.getAll();
      const superAdmins = await dal.superAdmin.getAll();
      return { groups, superAdmins };
    }),

  // superAdminProcedure.query(async ({ ctx }) => {
  //   const groups = await ctx.db.allocationGroup.findMany({});
  //   const superAdmins = await ctx.db.adminInSpace.findMany({
  //     where: { adminLevel: AdminLevel.SUPER },
  //     select: { user: { select: { id: true, name: true, email: true } } },
  //   });
  //   return { groups, superAdmins: superAdmins.map(({ user }) => user) };
  // }),

  takenGroupNames: procedure.superAdmin
    .output(z.set(z.string()))
    .query(
      async ({ ctx: { dal } }) =>
        new Set((await dal.group.getAll()).map((x) => x.displayName)),
    ),

  createGroup: procedure.superAdmin
    .input(z.object({ groupName: z.string() }))
    .output(groupDtoSchema) // used to be z.void(); still should be safe.
    .mutation(
      async ({ ctx: { dal }, input: { groupName } }) =>
        await AllocationGroup.create(dal, groupName),
    ),

  deleteGroup: procedure.group.superAdmin
    .output(z.void())
    .mutation(async ({ ctx: { group } }) => {
      await group.delete();
    }),
});

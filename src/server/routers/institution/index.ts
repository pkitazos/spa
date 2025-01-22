import { z } from "zod";

import { procedure } from "@/server/middleware";
import { createTRPCRouter } from "@/server/trpc";

import { groupRouter } from "./group";
import { instanceRouter } from "./instance";
import { subGroupRouter } from "./sub-group";

import { AllocationGroup } from "@/data-objects/spaces/group";
import { groupDtoSchema, userDtoSchema } from "@/dto";

export const institutionRouter = createTRPCRouter({
  group: groupRouter,
  subGroup: subGroupRouter,
  instance: instanceRouter,

  superAdminAccess: procedure.user
    .output(z.boolean())
    .query(async ({ ctx: { user } }) => await user.isSuperAdmin()),

  // TODO split
  // TODO rename
  groupManagement: procedure.superAdmin
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

  takenGroupNames: procedure.superAdmin
    .output(z.set(z.string()))
    .query(
      async ({ ctx: { dal } }) =>
        new Set((await dal.group.getAll()).map((x) => x.displayName)),
    ),

  createGroup: procedure.superAdmin
    .input(z.object({ groupName: z.string() }))
    .output(groupDtoSchema)
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

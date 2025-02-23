import { z } from "zod";

import { procedure } from "@/server/middleware";
import { createTRPCRouter } from "@/server/trpc";

import { groupRouter } from "./group";
import { instanceRouter } from "./instance";
import { subGroupRouter } from "./sub-group";

import { groupDtoSchema, userDtoSchema } from "@/dto";

export const institutionRouter = createTRPCRouter({
  group: groupRouter,
  subGroup: subGroupRouter,
  instance: instanceRouter,

  superAdminAccess: procedure.user
    .output(z.boolean())
    .query(async ({ ctx: { user } }) => await user.isSuperAdmin()),

  superAdmins: procedure.superAdmin
    .output(z.array(userDtoSchema))
    .query(async ({ ctx: { institution } }) => await institution.getAdmins()),

  groups: procedure.superAdmin
    .output(z.array(groupDtoSchema))
    .query(
      async ({ ctx: { institution } }) => await institution.getAllGroups(),
    ),

  takenGroupNames: procedure.superAdmin
    .output(z.set(z.string()))
    .query(
      async ({ ctx: { institution } }) =>
        new Set((await institution.getAllGroups()).map((x) => x.displayName)),
    ),

  createGroup: procedure.superAdmin
    .input(z.object({ groupName: z.string() }))
    .output(groupDtoSchema)
    .mutation(
      async ({ ctx: { institution }, input: { groupName } }) =>
        await institution.createGroup(groupName),
    ),

  deleteGroup: procedure.group.superAdmin
    .output(z.void())
    .mutation(async ({ ctx: { group } }) => {
      await group.delete();
    }),
});

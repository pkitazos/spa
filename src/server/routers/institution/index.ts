import { z } from "zod";

import { groupDtoSchema, userDtoSchema } from "@/dto";

import { User } from "@/data-objects";

import { procedure } from "@/server/middleware";
import { createTRPCRouter } from "@/server/trpc";

import { groupRouter } from "./group";
import { instanceRouter } from "./instance";
import { subGroupRouter } from "./sub-group";

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
    .query(async ({ ctx: { institution } }) => await institution.getGroups()),

  takenGroupNames: procedure.superAdmin
    .output(z.set(z.string()))
    .query(
      async ({ ctx: { institution } }) =>
        new Set((await institution.getGroups()).map((x) => x.displayName)),
    ),

  createGroup: procedure.superAdmin
    .input(z.object({ groupName: z.string() }))
    .output(groupDtoSchema)
    .mutation(async ({ ctx: { institution, audit }, input: { groupName } }) => {
      audit("created group", { group: groupName });
      return await institution.createGroup(groupName);
    }),

  deleteGroup: procedure.group.superAdmin
    .output(z.void())
    .mutation(async ({ ctx: { group, audit } }) => {
      audit("deleted group", group.params);
      await group.delete();
    }),

  inInstance_safe: procedure.user
    .input(z.object({ path: z.string() }))
    .output(z.boolean())
    .query(async ({ ctx: { institution }, input: { path } }) => {
      const [group, subGroup, instance] = path.split("/").toSpliced(0, 1);

      return await institution.instanceExists({ group, subGroup, instance });
    }),

  getAllUsers: procedure.superAdmin
    .output(z.array(userDtoSchema))
    .query(async ({ ctx: { institution } }) => institution.getUsers()),

  getDetailsForUser: procedure.superAdmin
    .input(z.object({ userId: z.string() }))
    .output(z.object({ user: userDtoSchema, isSuperAdmin: z.boolean() }))
    .query(async ({ ctx: { institution, db }, input: { userId } }) => {
      const userData = await institution.getUserById(userId);
      const user = User.fromDTO(db, userData);

      return { user: userData, isSuperAdmin: await user.isSuperAdmin() };
    }),

  createUser: procedure.superAdmin
    .input(z.object({ user: userDtoSchema }))
    .output(userDtoSchema)
    .mutation(async ({ ctx: { institution, audit }, input: { user } }) => {
      audit("created user", { user });
      return await institution.createUser(user);
    }),

  updateUser: procedure.superAdmin
    .input(z.object({ user: userDtoSchema }))
    .output(userDtoSchema)
    .mutation(async ({ ctx: { institution, audit }, input: { user } }) => {
      audit("updating user", { user });
      return await institution.updateUser(user);
    }),
});

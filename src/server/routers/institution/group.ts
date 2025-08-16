import { z } from "zod";

import { groupDtoSchema, subGroupDtoSchema, userDtoSchema } from "@/dto";
import {
  LinkUserResult,
  LinkUserResultSchema,
} from "@/dto/result/link-user-result";

import { procedure } from "@/server/middleware";
import { createTRPCRouter } from "@/server/trpc";

export const groupRouter = createTRPCRouter({
  exists: procedure.group.user
    .output(z.boolean())
    .query(async ({ ctx: { group } }) => await group.exists()),

  get: procedure.group.user
    .output(groupDtoSchema)
    .query(async ({ ctx: { group } }) => await group.get()),

  /**
   * returns true if the current user can access the specified group
   *
   */
  // MOVE to ac
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
    .mutation(async ({ ctx: { group, audit }, input: { name } }) => {
      audit("Created subgroup", { subgroup: name });
      return group.createSubGroup(name);
    }),

  deleteSubGroup: procedure.subgroup.groupAdmin
    .output(z.void())
    .mutation(async ({ ctx: { subGroup, audit } }) => {
      audit("Deleted subgroup");
      await subGroup.delete();
    }),

  // BREAKING input and return types changed
  addAdmin: procedure.group.superAdmin
    .input(z.object({ newAdmin: userDtoSchema }))
    .output(LinkUserResultSchema)
    .mutation(
      async ({ ctx: { group, institution, audit }, input: { newAdmin } }) => {
        const { id } = newAdmin;
        const userIsGroupAdmin = await group.isGroupAdmin(id);

        if (userIsGroupAdmin) {
          audit("Added new group admin", {
            adminId: id,
            result: LinkUserResult.PRE_EXISTING,
          });
          return LinkUserResult.PRE_EXISTING;
        }

        const userExists = await institution.userExists(id);
        if (!userExists) await institution.createUser(newAdmin);

        await group.linkAdmin(id);

        if (!userExists) {
          audit("Added new group admin", {
            adminId: id,
            result: LinkUserResult.CREATED_NEW,
          });

          return LinkUserResult.CREATED_NEW;
        }

        audit("Added new group admin", {
          adminId: id,
          result: LinkUserResult.OK,
        });
        return LinkUserResult.OK;
      },
    ),

  removeAdmin: procedure.group.superAdmin
    .input(z.object({ userId: z.string() }))
    .output(z.void())
    .mutation(async ({ ctx: { group, audit }, input: { userId } }) => {
      audit("removed group admin", { adminId: userId }, group.params);
      await group.unlinkAdmin(userId);
    }),
});

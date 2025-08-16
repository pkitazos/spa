import { z } from "zod";

import {
  flagDtoSchema,
  instanceDtoSchema,
  subGroupDtoSchema,
  tagDtoSchema,
  userDtoSchema,
} from "@/dto";
import {
  LinkUserResult,
  LinkUserResultSchema,
} from "@/dto/result/link-user-result";

import { procedure } from "@/server/middleware";
import { createTRPCRouter } from "@/server/trpc";

import { slugify } from "@/lib/utils/general/slugify";

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

      const subGroupAdmins = await subGroup.getAdmins();

      return { displayName, allocationInstances, subGroupAdmins };
    },
  ),

  // BREAKING return type change
  takenInstanceNames: procedure.subgroup.subgroupAdmin
    .output(z.set(z.string()))
    .query(
      async ({ ctx: { subGroup } }) =>
        await subGroup
          .getInstances()
          .then((x) => new Set(x.map((i) => i.displayName))),
    ),

  createInstance: procedure.subgroup.subgroupAdmin
    .input(
      z.object({
        newInstance: instanceDtoSchema.omit({ instance: true }),
        flags: z.array(flagDtoSchema),
        tags: z.array(tagDtoSchema.omit({ id: true })),
      }),
    )
    .output(z.void())
    .mutation(
      async ({
        ctx: { subGroup, audit },
        input: { newInstance, flags, tags },
      }) => {
        await subGroup.createInstance({ newInstance, flags, tags });
        audit("Created instance", {
          instance: slugify(newInstance.displayName),
        });
      },
    ),

  deleteInstance: procedure.instance.subGroupAdmin
    .output(z.void())
    .mutation(async ({ ctx: { instance, audit } }) => {
      await instance.delete();
      audit("Deleted instance");
    }),

  // BREAKING input and output types changed
  addAdmin: procedure.subgroup.groupAdmin
    .input(z.object({ newAdmin: userDtoSchema }))
    .output(LinkUserResultSchema)
    .mutation(
      async ({
        ctx: { institution, subGroup, audit },
        input: { newAdmin },
      }) => {
        const { id } = newAdmin;
        const userIsGroupAdmin = await subGroup.isSubGroupAdmin(id);

        if (userIsGroupAdmin) {
          audit("Added subgroup admin", {
            adminId: id,
            result: LinkUserResult.PRE_EXISTING,
          });
          return LinkUserResult.PRE_EXISTING;
        }

        const userExists = await institution.userExists(id);
        if (!userExists) await institution.createUser(newAdmin);

        await subGroup.linkAdmin(id);

        if (!userExists) {
          audit("Added subgroup admin", {
            adminId: id,
            result: LinkUserResult.CREATED_NEW,
          });
          return LinkUserResult.CREATED_NEW;
        }

        audit("Added subgroup admin", {
          adminId: id,
          result: LinkUserResult.OK,
        });
        return LinkUserResult.OK;
      },
    ),

  removeAdmin: procedure.subgroup.groupAdmin
    .input(z.object({ userId: z.string() }))
    .output(z.void())
    .mutation(async ({ ctx: { subGroup, audit }, input: { userId } }) => {
      audit("removed subgroup admin", { adminId: userId }, subGroup.params);
      await subGroup.unlinkAdmin(userId);
    }),
});

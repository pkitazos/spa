import { z } from "zod";

import { procedure } from "@/server/middleware";
import { createTRPCRouter } from "@/server/trpc";

import {
  flagDtoSchema,
  instanceDtoSchema,
  subGroupDtoSchema,
  tagDtoSchema,
  userDtoSchema,
} from "@/dto";
import { LinkUserResult, LinkUserResultSchema } from "@/dto/link-user-result";

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
        flags: z.array(flagDtoSchema.omit({ id: true })),
        tags: z.array(tagDtoSchema.omit({ id: true })),
      }),
    )
    .output(z.void())
    .mutation(
      async ({ ctx: { subGroup }, input: { newInstance, flags, tags } }) =>
        await subGroup.createInstance({ newInstance, flags, tags }),
    ),

  deleteInstance: procedure.instance.subGroupAdmin
    .output(z.void())
    .mutation(async ({ ctx: { instance } }) => await instance.delete()),

  // BREAKING input and output types changed
  addAdmin: procedure.subgroup.groupAdmin
    .input(z.object({ newAdmin: userDtoSchema }))
    .output(LinkUserResultSchema)
    .mutation(
      async ({ ctx: { institution, subGroup }, input: { newAdmin } }) => {
        const { id } = newAdmin;
        const userIsGroupAdmin = await subGroup.isSubGroupAdmin(id);

        if (userIsGroupAdmin) return LinkUserResult.PRE_EXISTING;

        const userExists = await institution.userExists(id);
        if (!userExists) institution.createUser(newAdmin);

        await subGroup.linkAdmin(id);

        if (!userExists) return LinkUserResult.CREATED_NEW;

        return LinkUserResult.OK;
      },
    ),

  removeAdmin: procedure.subgroup.groupAdmin
    .input(z.object({ userId: z.string() }))
    .output(z.void())
    .mutation(async ({ ctx: { subGroup }, input: { userId } }) => {
      await subGroup.unlinkAdmin(userId);
    }),
});

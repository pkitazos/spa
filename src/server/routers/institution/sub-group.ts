import { z } from "zod";

import { createdInstanceSchema } from "@/lib/validations/instance-form";

import { procedure } from "@/server/middleware";
import { createTRPCRouter } from "@/server/trpc";

import { subGroupDtoSchema, userDtoSchema } from "@/dto";
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
    .input(z.object({ newInstance: createdInstanceSchema }))
    .output(z.void())
    .mutation(
      async ({ ctx: { subGroup }, input: { newInstance } }) =>
        await subGroup.createInstance(newInstance),
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

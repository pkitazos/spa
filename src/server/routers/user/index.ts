import { z } from "zod";

import { validatedSegmentsSchema } from "@/lib/validations/breadcrumbs";
import { instanceParamsSchema } from "@/lib/validations/params";

import { procedure } from "@/server/middleware";
import { createTRPCRouter, roleAwareProcedure } from "@/server/trpc";

import { studentRouter } from "./student";
import { supervisorRouter } from "./supervisor";

import { User } from "@/data-objects/users/user";
import { Role } from "@/db";
import { instanceDisplayDataSchema, userDtoSchema } from "@/dto";

export const userRouter = createTRPCRouter({
  student: studentRouter,
  supervisor: supervisorRouter,

  get: procedure.user
    .output(userDtoSchema)
    .query(async ({ ctx }) => await ctx.user.toDTO()),

  getById: procedure.user
    .input(z.object({ userId: z.string() }))
    .output(userDtoSchema)
    .query(
      async ({ ctx: { dal }, input: { userId } }) =>
        await new User(dal, userId).toDTO(),
    ),

  /**
   * @deprecated users can have multiple roles in an instance - use `roles` instead
   */
  role: roleAwareProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(async ({ ctx }) => ctx.session.user.role),

  roles: procedure.instance.user
    .output(z.set(z.nativeEnum(Role)))
    .query(
      async ({ ctx: { user, instance } }) =>
        await user.getRolesInInstance(instance.params),
    ),

  hasSelfDefinedProject: procedure.instance.user
    .output(z.boolean())
    .query(async ({ ctx: { user, instance } }) => {
      if (!user.isInstanceStudent(instance.params)) return false;
      return await user
        .toInstanceStudent(instance.params)
        .then((student) => student.hasSelfDefinedProject());
    }),

  getAdminPanel: procedure.user
    .output(z.array(z.object({ displayName: z.string(), path: z.string() })))
    .query(async ({ ctx: { user } }) => {
      if (await user.isSuperAdmin()) {
        return [{ displayName: "Super-Admin Panel", path: "/admin" }];
      }

      const groups = await user.getManagedGroups();
      const subGroups = await user.getManagedSubGroups();

      return [...groups, ...subGroups];
    }),

  instances: procedure.user
    .output(z.array(instanceDisplayDataSchema))
    .query(async ({ ctx: { user } }) => await user.getInstances()),

  // TODO: rename
  breadcrumbs: procedure.user
    .input(z.object({ segments: z.array(z.string()) }))
    .output(z.array(validatedSegmentsSchema))
    .query(
      async ({ ctx: { user }, input: { segments } }) =>
        await user.authoriseBreadcrumbs(segments),
    ),

  joinInstance: procedure.instance.user.mutation(
    async ({ ctx: { user, instance } }) => {
      await user.joinInstance(instance.params);
    },
  ),
});

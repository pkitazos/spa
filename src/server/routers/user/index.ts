import { z } from "zod";

import { validatedSegmentsSchema } from "@/lib/validations/breadcrumbs";

import { procedure } from "@/server/middleware";
import { createTRPCRouter } from "@/server/trpc";

import { studentRouter } from "./student";
import { supervisorRouter } from "./supervisor";

import { Role } from "@/db/types";
import { instanceDisplayDataSchema, userDtoSchema } from "@/dto";
import { User, AllocationInstance } from "@/data-objects";
import { markerRouter } from "./marker";

export const userRouter = createTRPCRouter({
  student: studentRouter,
  supervisor: supervisorRouter,
  marker: markerRouter,

  get: procedure.user
    .output(userDtoSchema)
    .query(async ({ ctx }) => await ctx.user.toDTO()),

  getById: procedure.user
    .input(z.object({ userId: z.string() }))
    .output(userDtoSchema)
    .query(
      async ({ ctx: { db }, input: { userId } }) =>
        await new User(db, userId).toDTO(),
    ),

  roles: procedure.instance.user
    .output(z.set(z.nativeEnum(Role)))
    .query(
      async ({ ctx: { user, instance } }) =>
        await user.getRolesInInstance(instance.params),
    ),

  hasSelfDefinedProject: procedure.instance.user
    .output(z.boolean())
    .query(async ({ ctx: { user, instance } }) => {
      if (!user.isStudent(instance.params)) return false;
      return await user
        .toStudent(instance.params)
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

      // TODO does this need to be nubs'ed?
      return [...groups, ...subGroups];
    }),

  instances: procedure.user
    .output(z.array(instanceDisplayDataSchema))
    .query(
      async ({ ctx: { db, user } }) =>
        await AllocationInstance.toQualifiedPaths(
          db,
          await user.getInstances(),
        ),
    ),

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

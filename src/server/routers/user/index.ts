import { z } from "zod";

import {
  ValidatedSegments,
  validatedSegmentsSchema,
} from "@/lib/validations/breadcrumbs";
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

  // TODO refactor to use dal and/or object methods
  getAdminPanel: procedure.user
    .output(z.array(z.object({ displayName: z.string(), path: z.string() })))
    .query(async ({ ctx: { user, db } }) => {
      // if the user is a super-admin return the super-admin panel

      if (await user.isSuperAdmin()) {
        return [{ displayName: "Super-Admin Panel", path: "/admin" }];
      }

      // get all the spaces the user is an admin in
      // sort by admin level
      // return a list of admin panels

      const groups = await db.groupAdmin
        .findMany({
          where: { userId: user.id },
          select: { allocationGroup: true },
        })
        .then((data) =>
          data.map((x) => ({
            displayName: x.allocationGroup.displayName,
            path: `/${x.allocationGroup.id}`,
          })),
        );

      const subGroups = await db.subGroupAdmin
        .findMany({
          where: { userId: user.id },
          select: { allocationGroup: true, allocationSubGroup: true },
        })
        .then((data) =>
          data.map((x) => ({
            displayName: x.allocationSubGroup.displayName,
            path: `/${x.allocationGroup.id}/${x.allocationSubGroup.id}`,
          })),
        );

      return [...groups, ...subGroups];
    }),

  instances: procedure.user
    .output(z.array(instanceDisplayDataSchema))
    .query(async ({ ctx: { user } }) => await user.getInstances()),

  // TODO: rename
  breadcrumbs: procedure.user
    .input(z.object({ segments: z.array(z.string()) }))
    .output(z.array(validatedSegmentsSchema))
    .query(async ({ ctx: { user }, input: { segments } }) => {
      // TODO
      // This is fine as is, but I'd ask two things:
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [group, subGroup, instance, projectId] = segments;
      const res: ValidatedSegments[] = [];
      if (group) {
        res.push({
          segment: group,
          access: await user.isGroupAdminOrBetter({ group }),
        });
      }
      if (subGroup) {
        res.push({
          segment: subGroup,
          access: await user.isSubGroupAdminOrBetter({ group, subGroup }),
        });
      }
      if (instance) {
        res.push({
          segment: instance,
          access: await user.isInstanceMember({ group, subGroup, instance }),
        });
      }
      if (projectId) {
        res.push({
          segment: projectId,
          access: true,
        });
      }

      // TODO: this doesn't yet handle users access to the /supervisors/[id] and /students/[id] routes (possibly going to be a new /readers/[id] route)
      // users who don't have access to those pages should still see the breadcrumbs with the correct permissions to be able to navigate back to their allowed pages
      return res;
    }),

  joinInstance: procedure.instance.user.mutation(
    async ({ ctx: { user, instance } }) => {
      await user.joinInstance(instance.params);
    },
  ),
});

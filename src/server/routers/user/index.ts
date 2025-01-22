import { z } from "zod";

import { relativeComplement } from "@/lib/utils/general/set-difference";
import { permissionCheck } from "@/lib/utils/permissions/permission-check";
import {
  ValidatedSegments,
  validatedSegmentsSchema,
} from "@/lib/validations/breadcrumbs";
import { instanceParamsSchema } from "@/lib/validations/params";
import { instanceDisplayDataSchema } from "@/lib/validations/spaces";

import { procedure } from "@/server/middleware";
import {
  createTRPCRouter,
  multiRoleAwareProcedure,
  publicProcedure,
  roleAwareProcedure,
} from "@/server/trpc";

import { getDisplayNameMap } from "./_utils/instance";
import { studentRouter } from "./student";
import { supervisorRouter } from "./supervisor";

import { AllocationInstance } from "@/data-objects/spaces/instance";
import { User } from "@/data-objects/users/user";
import { userDtoSchema } from "@/dto";
import { Role } from "@/db";

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

  // TODO refactor to use dal and/or object methods
  instances: procedure.user
    .output(z.array(instanceDisplayDataSchema))
    .query(async ({ ctx }) => {
      const { user, dal } = ctx;
      const getDisplayData = await getDisplayNameMap(ctx.db);

      // if the user is a super-admin return all instances
      if (await user.isSuperAdmin()) {
        const allInstances = await dal.instance.getAll();
        return allInstances.map(getDisplayData);
      }

      // can safely assert that the user is not a super-admin

      // user is an admin in these spaces
      const groups = await dal.groupAdmin.getAllGroups(user.id);

      const groupAdminInstances = await dal.instance.getForGroups(groups);

      const subGroups = await dal.subGroupAdmin.getAllSubgroups(user.id);

      const uniqueSubGroups = relativeComplement(
        subGroups,
        groups,
        (a, b) => a.group == b.group,
      );

      const subGroupAdminInstances =
        await dal.instance.getForGroups(uniqueSubGroups);

      const privilegedInstances = [
        ...groupAdminInstances,
        ...subGroupAdminInstances,
      ];

      // user has some role in these instances (student or supervisor or reader)
      const unprivilegedInstances = await dal.user.getAllInstances(user.id);

      const uniqueUnprivileged = relativeComplement(
        unprivilegedInstances,
        privilegedInstances,
        AllocationInstance.eq,
      );

      const allInstances = [...privilegedInstances, ...uniqueUnprivileged];
      return allInstances.map(getDisplayData);
    }),

  breadcrumbs: procedure.user
    .input(z.object({ segments: z.array(z.string()) }))
    .output(z.array(validatedSegmentsSchema))
    .query(async ({ ctx: { user }, input: { segments } }) => {
      // TODO
      // This is fine as is, but I'd ask two things:
      // 1. why is it "user.breadcrumbs"?
      // @JakeTrevor - well the access to the breadcrumbs is based on the user's permissions
      // 2. should the logic below live somewhere else?
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
      // if (projectId) {
      //   res.push({
      //     segment: projectId,
      //     access: await user.canAccessProject({
      //       group,
      //       subGroup,
      //       instance,
      //       projectId,
      //     }),
      //   });
      // }

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

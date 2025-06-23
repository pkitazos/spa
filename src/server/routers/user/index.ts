import { z } from "zod";

import { validatedSegmentsSchema } from "@/lib/validations/breadcrumbs";

import { procedure } from "@/server/middleware";
import { createTRPCRouter } from "@/server/trpc";

import { studentRouter } from "./student";
import { supervisorRouter } from "./supervisor";

import { Role, roleSchema } from "@/db/types";
import {
  adminPanelPathSchema,
  instanceDisplayDataSchema,
  InstanceDTO,
  userDtoSchema,
} from "@/dto";
import { User, AllocationInstance } from "@/data-objects";
import { markerRouter } from "./marker";
import { testUserEmails } from "@/config/testing-users";
import { relativeComplement } from "@/lib/utils/general/set-difference";

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
      if (!(await user.isStudent(instance.params))) return false;

      return await user
        .toStudent(instance.params)
        .then((student) => student.hasSelfDefinedProject());
    }),

  // TODO: the output type is whack
  getAdminPanels: procedure.user
    .output(z.array(adminPanelPathSchema))
    .query(async ({ ctx: { user } }) => {
      if (await user.isSuperAdmin()) {
        // ? since we show super-admins all instances, should we also show them all admin panels?
        // ? or should we just show them the super-admin panel?
        return [{ displayName: "Super-Admin Panel", path: "/admin" }];
      }

      const groups = await user
        .getManagedGroups()
        .then((groupData) =>
          groupData
            .sort((a, b) => a.displayName.localeCompare(b.displayName))
            .map(({ displayName, group }) => ({
              displayName: displayName,
              path: `/${group}`,
              group: { id: group, displayName: displayName },
            })),
        );

      const subGroups = await user
        .getManagedSubGroupsWithGroups()
        .then((subGroupData) =>
          subGroupData
            .sort((a, b) =>
              a.subGroup.displayName.localeCompare(b.subGroup.displayName),
            )
            .sort((a, b) =>
              a.group.displayName.localeCompare(b.group.displayName),
            )
            .map(({ subGroup: s, group: g }) => ({
              displayName: s.displayName,
              path: `/${g.group}/${s.subGroup}`,
              group: { id: g.group, displayName: g.displayName },
              subGroup: { id: s.subGroup, displayName: s.displayName },
            })),
        );

      const uniqueSubGroups = relativeComplement(subGroups, groups, (sg, g) =>
        sg.path.startsWith(g.path),
      );

      return [...groups, ...uniqueSubGroups];
    }),

  // TODO: the output type is whack
  getInstances: procedure.user
    .output(
      z.array(instanceDisplayDataSchema.extend({ roles: z.array(roleSchema) })),
    )
    .query(async ({ ctx: { db, user } }) => {
      const userInstances = await user.getInstances();
      if (userInstances.length === 0) return [];

      const instanceRoles: { instance: InstanceDTO; roles: Role[] }[] = [];
      for (const i of userInstances) {
        const roles = await user.getRolesInInstance(i);
        instanceRoles.push({ instance: i, roles: Array.from(roles) });
      }

      const qualifiedPaths = await AllocationInstance.toQualifiedPaths(
        db,
        userInstances,
      );

      return qualifiedPaths.map((path) => {
        const matchingInstanceRole = instanceRoles.find(
          ({ instance }) =>
            instance.group === path.group.id &&
            instance.subGroup === path.subGroup.id &&
            instance.instance === path.instance.id,
        );

        return {
          ...path,
          roles: matchingInstanceRole?.roles.map((role) => role) || [],
        };
      });
    }),

  // TODO: rename
  breadcrumbs: procedure.user
    .input(z.object({ segments: z.array(z.string()) }))
    .output(z.array(validatedSegmentsSchema))
    .query(
      async ({ ctx: { user }, input: { segments } }) =>
        await user.authoriseBreadcrumbs(segments),
    ),

  joinInstance: procedure.instance.user.mutation(
    async ({ ctx: { user, instance, audit } }) => {
      audit("joining instance", { instance: instance.params });
      await user.joinInstance(instance.params);
    },
  ),

  getTestUsers: procedure.user
    .output(z.array(userDtoSchema))
    .query(async ({ ctx: { db } }) => {
      const users = await db.user.findMany({
        where: { email: { in: testUserEmails.map((x) => x.email) } },
      });

      return users.sort((a, b) => {
        const aOrd =
          testUserEmails.find((x) => x.email === a.email)?.ord ??
          Number.MAX_SAFE_INTEGER;

        const bOrd =
          testUserEmails.find((x) => x.email === b.email)?.ord ??
          Number.MAX_SAFE_INTEGER;

        return aOrd - bOrd;
      });
    }),
});

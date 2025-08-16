import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  AllocationGroup,
  AllocationInstance,
  Institution,
  Project,
  AllocationSubGroup,
  User,
  MatchingAlgorithm,
} from "@/data-objects";

import { Role, type Stage } from "@/db/types";

import { type AuditFn } from "@/lib/logging/logger";
import { HttpMatchingService } from "@/lib/services/matching";
import {
  groupParamsSchema,
  instanceParamsSchema,
  projectParamsSchema,
  subGroupParamsSchema,
} from "@/lib/validations/params";

import { t } from "./trpc";

const institutionMiddleware = t.middleware(async ({ ctx: { db }, next }) => {
  const institution = new Institution(db);
  return next({ ctx: { institution } });
});

/**
 * @requires a preceding `.input(z.object({ params: groupParamsSchema }))` or better
 */
const groupMiddleware = t.middleware(
  async ({ ctx: { db, audit }, input, next }) => {
    const { params } = z.object({ params: groupParamsSchema }).parse(input);
    const group = new AllocationGroup(db, params);

    const auditNew: AuditFn = function auditNew(msg, ...vals) {
      audit(msg, ...vals, { group: params.group });
    };

    return next({ ctx: { group, audit: auditNew } });
  },
);

/**
 * @requires a preceding `.input(z.object({ params: subGroupParamsSchema }))` or better
 */
const subGroupMiddleware = t.middleware(
  async ({ ctx: { db, audit }, input, next }) => {
    const { params } = z.object({ params: subGroupParamsSchema }).parse(input);
    const subGroup = new AllocationSubGroup(db, params);

    const auditNew: AuditFn = function auditNew(msg, ...vals) {
      audit(msg, ...vals, { subGroup: params.subGroup });
    };

    return next({ ctx: { subGroup, audit: auditNew } });
  },
);

/**
 * @requires a preceding `.input(z.object({ params: instanceParamsSchema }))`
 */
const instanceMiddleware = t.middleware(
  async ({ ctx: { db, audit }, input, next }) => {
    const { params } = z.object({ params: instanceParamsSchema }).parse(input);
    const instance = new AllocationInstance(db, params);

    const auditNew: AuditFn = function auditNew(msg, ...vals) {
      audit(msg, ...vals, { subGroup: params.subGroup });
    };

    return next({ ctx: { instance, audit: auditNew } });
  },
);

/**
 * @requires a preceding `.input(z.object({params: instanceParamsSchema}))`
 * Adds a check to ensure the provided instance is in a set of allowed stages
 * @param allowedStages a list of stages in which a procedure using this middleware can run
 * @returns A middleware
 */
const stageMiddleware = (allowedStages: Stage[]) =>
  instanceMiddleware.unstable_pipe(async ({ ctx: { instance }, next }) => {
    const instanceData = await instance.get();

    if (!allowedStages.includes(instanceData.stage)) {
      // ? maybe this error should also be logged using the Error Logger?
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Instance is not in correct stage",
      });
    }

    return next();
  });

/**
 * @requires a preceding `.input(z.object({ params: projectParamsSchema }))`
 */
const projectMiddleware = t.middleware(
  async ({ ctx: { db, audit }, input, next }) => {
    const { params } = z.object({ params: projectParamsSchema }).parse(input);
    const project = new Project(db, params);

    const auditNew: AuditFn = function auditNew(msg, ...vals) {
      audit(msg, ...vals, { projectId: params.projectId });
    };

    return next({ ctx: { project, audit: auditNew } });
  },
);

/**
 * @requires a preceding `.input(z.object({ params: instanceParamsSchema, algId: z.string() }))`
 */
const algorithmMiddleware = t.middleware(
  async ({ ctx: { db }, input, next }) => {
    const { params, algId } = z
      .object({ params: instanceParamsSchema, algId: z.string() })
      .parse(input);
    const matchingService = new HttpMatchingService();
    const alg = new MatchingAlgorithm(
      db,
      { algConfigId: algId, ...params },
      matchingService,
    );
    return next({ ctx: { alg } });
  },
);

const authedMiddleware = t.middleware(({ ctx: { db, session }, next }) => {
  if (!session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User is not signed in",
    });
  }
  const user = new User(db, session.user.id);
  return next({ ctx: { user } });
});

const SuperAdminMiddleware = authedMiddleware.unstable_pipe(
  async ({ ctx: { user }, next }) => {
    if (!(await user.isSuperAdmin())) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User is not an admin",
      });
    }

    return next({ ctx: { user: await user.toSuperAdmin() } });
  },
);

/**
 * @requires a preceding `.input(z.object({ params: groupParamsSchema }))` or better
 */
const GroupAdminMiddleware = authedMiddleware.unstable_pipe(
  async ({ ctx: { user }, next, input }) => {
    const { params } = z.object({ params: groupParamsSchema }).parse(input);

    if (!(await user.isGroupAdminOrBetter(params))) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User is not a group admin of group XXX",
      });
    }

    return next({ ctx: { user: await user.toGroupAdmin(params) } });
  },
);

/**
 * @requires a preceding `.input(z.object({ params: subGroupParamsSchema }))` or better
 */
const SubGroupAdminMiddleware = authedMiddleware.unstable_pipe(
  async ({ ctx: { user }, next, input }) => {
    const { params } = z.object({ params: subGroupParamsSchema }).parse(input);

    if (!(await user.isSubGroupAdminOrBetter(params))) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User is not a group admin of group XXX",
      });
    }

    return next({ ctx: { user: await user.toSubGroupAdmin(params) } });
  },
);

/**
 * @requires a preceding `.input(z.object({ params: instanceParamsSchema }))` or better
 */
const studentMiddleware = authedMiddleware.unstable_pipe(
  async ({ ctx: { user }, next, input }) => {
    const { params } = z.object({ params: instanceParamsSchema }).parse(input);

    if (!(await user.isStudent(params))) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User is not a group admin of group XXX",
      });
    }

    return next({ ctx: { user: await user.toStudent(params) } });
  },
);

/**
 * @requires a preceding `.input(z.object({ params: instanceParamsSchema }))` or better
 */
const supervisorMiddleware = authedMiddleware.unstable_pipe(
  async ({ ctx: { user }, next, input }) => {
    const { params } = z.object({ params: instanceParamsSchema }).parse(input);

    if (!(await user.isSupervisor(params))) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User is not a group admin of group XXX",
      });
    }

    return next({ ctx: { user: await user.toSupervisor(params) } });
  },
);

/**
 * @requires a preceding `.input(z.object({ params: instanceParamsSchema }))` or better
 */
const markerMiddleware = authedMiddleware.unstable_pipe(
  async ({ ctx: { user }, next, input }) => {
    const { params } = z.object({ params: instanceParamsSchema }).parse(input);

    if (!(await user.isMarker(params))) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User is not a marker of group XXX",
      });
    }

    return next({ ctx: { user: await user.toMarker(params) } });
  },
);

/**
 * @requires a preceding `.input(z.object({ params: instanceParamsSchema }))` or better
 */
function mkRoleMiddleware(allowedRoles: Role[]) {
  return authedMiddleware.unstable_pipe(
    async ({ ctx: { user }, next, input }) => {
      const { params } = z
        .object({ params: instanceParamsSchema })
        .parse(input);

      if (
        allowedRoles.includes(Role.ADMIN) &&
        (await user.isSubGroupAdminOrBetter(params))
      ) {
        return next();
      }

      if (allowedRoles.includes(Role.READER) && (await user.isReader(params))) {
        return next();
      }

      if (
        allowedRoles.includes(Role.STUDENT) &&
        (await user.isStudent(params))
      ) {
        return next();
      }

      if (
        allowedRoles.includes(Role.SUPERVISOR) &&
        (await user.isSupervisor(params))
      ) {
        return next();
      }

      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User does not have one of the allowed roles",
      });
    },
  );
}

// Primitives (DO NOT EXPORT)
const institutionProcedure = t.procedure.use(institutionMiddleware);

const groupProcedure = institutionProcedure
  .input(z.object({ params: groupParamsSchema }))
  .use(groupMiddleware);

const subgroupProcedure = institutionProcedure
  .input(z.object({ params: subGroupParamsSchema }))
  .use(groupMiddleware)
  .use(subGroupMiddleware);

const instanceProcedure = institutionProcedure
  .input(z.object({ params: instanceParamsSchema }))
  .use(groupMiddleware)
  .use(subGroupMiddleware)
  .use(instanceMiddleware);

const projectProcedure = institutionProcedure
  .input(z.object({ params: projectParamsSchema }))
  .use(groupMiddleware)
  .use(subGroupMiddleware)
  .use(instanceMiddleware)
  .use(projectMiddleware);

const algorithmProcedure = institutionProcedure
  .input(z.object({ params: instanceParamsSchema, algId: z.string() }))
  .use(groupMiddleware)
  .use(subGroupMiddleware)
  .use(instanceMiddleware)
  .use(algorithmMiddleware);

export const procedure = {
  // site wide procedures (i.e. not tied to a space)
  user: institutionProcedure.use(authedMiddleware),
  superAdmin: institutionProcedure.use(SuperAdminMiddleware),

  group: {
    user: groupProcedure.use(authedMiddleware),
    superAdmin: groupProcedure.use(SuperAdminMiddleware),
    groupAdmin: groupProcedure.use(GroupAdminMiddleware),
  },

  subgroup: {
    user: subgroupProcedure.use(authedMiddleware),
    superAdmin: subgroupProcedure.use(SuperAdminMiddleware),
    groupAdmin: subgroupProcedure.use(GroupAdminMiddleware),
    subgroupAdmin: subgroupProcedure.use(SubGroupAdminMiddleware),
  },

  instance: {
    user: instanceProcedure.use(authedMiddleware),
    superAdmin: instanceProcedure.use(SuperAdminMiddleware),
    groupAdmin: instanceProcedure.use(GroupAdminMiddleware),
    subGroupAdmin: instanceProcedure.use(SubGroupAdminMiddleware),
    student: instanceProcedure.use(studentMiddleware),
    supervisor: instanceProcedure.use(supervisorMiddleware),
    marker: instanceProcedure.use(markerMiddleware),
    withRoles: (allowedRoles: Role[]) =>
      instanceProcedure.use(mkRoleMiddleware(allowedRoles)),

    inStage: (allowedStages: Stage[]) => {
      const proc = institutionProcedure
        .input(z.object({ params: instanceParamsSchema }))
        .use(groupMiddleware)
        .use(subGroupMiddleware)
        .use(stageMiddleware(allowedStages));

      return {
        user: proc.use(authedMiddleware),
        superAdmin: proc.use(SuperAdminMiddleware),
        groupAdmin: proc.use(GroupAdminMiddleware),
        subGroupAdmin: proc.use(SubGroupAdminMiddleware),
        student: proc.use(studentMiddleware),
        supervisor: proc.use(supervisorMiddleware),
        marker: proc.use(markerMiddleware),
        withRoles: (allowedRoles: Role[]) =>
          proc.use(mkRoleMiddleware(allowedRoles)),
      };
    },
  },

  project: {
    user: projectProcedure.use(authedMiddleware),
    superAdmin: projectProcedure.use(SuperAdminMiddleware),
    groupAdmin: projectProcedure.use(GroupAdminMiddleware),
    subGroupAdmin: projectProcedure.use(SubGroupAdminMiddleware),
    supervisor: projectProcedure.use(supervisorMiddleware),
    marker: projectProcedure.use(markerMiddleware),
    withRoles: (allowedRoles: Role[]) =>
      projectProcedure.use(mkRoleMiddleware(allowedRoles)),

    inStage: (allowedStages: Stage[]) => {
      const proc = institutionProcedure
        .input(z.object({ params: projectParamsSchema }))
        .use(groupMiddleware)
        .use(subGroupMiddleware)
        .use(stageMiddleware(allowedStages))
        .use(projectMiddleware);

      return {
        user: proc.use(authedMiddleware),
        superAdmin: proc.use(SuperAdminMiddleware),
        groupAdmin: proc.use(GroupAdminMiddleware),
        subGroupAdmin: proc.use(SubGroupAdminMiddleware),
        supervisor: proc.use(supervisorMiddleware),
        marker: proc.use(markerMiddleware),
        withRoles: (allowedRoles: Role[]) =>
          proc.use(mkRoleMiddleware(allowedRoles)),
      };
    },
  },

  algorithm: {
    user: algorithmProcedure.use(authedMiddleware),
    superAdmin: algorithmProcedure.use(SuperAdminMiddleware),
    groupAdmin: algorithmProcedure.use(GroupAdminMiddleware),
    subGroupAdmin: algorithmProcedure.use(SubGroupAdminMiddleware),

    inStage: (allowedStages: Stage[]) => {
      const proc = institutionProcedure
        .input(z.object({ params: instanceParamsSchema, algId: z.string() }))
        .use(groupMiddleware)
        .use(subGroupMiddleware)
        .use(stageMiddleware(allowedStages))
        .use(algorithmMiddleware);

      return {
        user: proc.use(authedMiddleware),
        superAdmin: proc.use(SuperAdminMiddleware),
        groupAdmin: proc.use(GroupAdminMiddleware),
        subGroupAdmin: proc.use(SubGroupAdminMiddleware),
      };
    },
  },
};

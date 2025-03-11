import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  groupParamsSchema,
  instanceParamsSchema,
  projectParamsSchema,
  subGroupParamsSchema,
} from "@/lib/validations/params";

import { t } from "./trpc";

import {
  AllocationGroup,
  AllocationInstance,
  Institution,
  Project,
  AllocationSubGroup,
  User,
  MatchingAlgorithm,
} from "@/data-objects";
import { Role, Stage } from "@/db/types";

// We should re-imagine how our middleware works

// First, I'm re-writing the space middlewares, as so:
// Note that each type of space gets its own DTO, which you can find in:
//      `data-objects/spaces`

const institutionMiddleware = t.middleware(async ({ ctx: { db }, next }) => {
  const institution = new Institution(db);
  return next({ ctx: { institution } });
});

/**
 * @requires a preceding `.input(z.object({ params: groupParamsSchema }))` or better
 */
const groupMiddleware = t.middleware(async ({ ctx: { db }, input, next }) => {
  const { params } = z.object({ params: groupParamsSchema }).parse(input);
  const group = new AllocationGroup(db, params);
  return next({ ctx: { group } });
});

/**
 * @requires a preceding `.input(z.object({ params: subGroupParamsSchema }))` or better
 */
const subGroupMiddleware = t.middleware(
  async ({ ctx: { db }, input, next }) => {
    const { params } = z.object({ params: subGroupParamsSchema }).parse(input);
    const subGroup = new AllocationSubGroup(db, params);
    return next({ ctx: { subGroup } });
  },
);

/**
 * @requires a preceding `.input(z.object({ params: instanceParamsSchema }))`
 */
const instanceMiddleware = t.middleware(
  async ({ ctx: { db }, input, next }) => {
    const { params } = z.object({ params: instanceParamsSchema }).parse(input);
    const instance = new AllocationInstance(db, params);
    return next({ ctx: { instance } });
  },
);

// * NEW!
// Stage middleware
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
const projectMiddleware = t.middleware(async ({ ctx: { db }, input, next }) => {
  const { params } = z.object({ params: projectParamsSchema }).parse(input);
  const project = new Project(db, params);
  return next({ ctx: { project } });
});

const algorithmMiddleware = t.middleware(
  async ({ ctx: { db }, input, next }) => {
    const { params, algId } = z
      .object({ params: instanceParamsSchema, algId: z.string() })
      .parse(input);
    const alg = new MatchingAlgorithm(db, { algConfigId: algId, ...params });
    return next({ ctx: { alg } });
  },
);

// Next, Lets consider the authenticated (permission protected) middlewares:
// DTOs should be created for different kinds of users. These are in:
//      `data-objects/users`

// We can use this as follows:

const authedMiddleware = t.middleware(({ ctx: { db, session }, next }) => {
  if (!session || !session.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User is not signed in",
    });
  }
  const user = new User(db, session.user.id);
  return next({ ctx: { user } });
});

// this already lets us write more powerful stuff like this:

const SuperAdminMiddleware = authedMiddleware.unstable_pipe(
  async ({ ctx: { user }, next }) => {
    if (!user.isSuperAdmin()) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User is not an admin",
      });
    }

    return next({ ctx: { user: await user.toSuperAdmin() } });
  },
);

// Note now it reveals the below requirement:

/**
 * @requires a preceding `.input(z.object({ params: groupParamsSchema }))` or better
 */
const GroupAdminMiddleware = authedMiddleware.unstable_pipe(
  async ({ ctx: { user }, next, input }) => {
    const { params } = z.object({ params: groupParamsSchema }).parse(input);

    if (!user.isGroupAdminOrBetter(params)) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User is not a group admin of group XXX",
      });
    }

    return next({ ctx: { user: await user.toGroupAdmin(params) } });
  },
);

// A group-admin procedure will require you to specify which group you're working in - and thus a corresponding .input() call.

/**
 * @requires a preceding `.input(z.object({ params: subGroupParamsSchema }))` or better
 */
const SubGroupAdminMiddleware = authedMiddleware.unstable_pipe(
  async ({ ctx: { user }, next, input }) => {
    const { params } = z.object({ params: subGroupParamsSchema }).parse(input);

    if (!user.isSubGroupAdminOrBetter(params)) {
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

    if (!user.isStudent(params)) {
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

    if (!user.isSupervisor(params)) {
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

    if (!user.isMarker(params)) {
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

// Note that the logic of determining weather a user is a group admin is isolated to the data object
// the business logic is not tied up with our tRPC - uncle bob would be proud.

// now we can write the proper procedures:

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

// So:

// A procedure in an instance with group-admin permissions would be:
procedure.instance.groupAdmin
  .input(z.object({ q: z.string() }))
  .query(({ ctx: _c, input: _ }) => {});
// NB the types - no `| undefined` freakiness

// an example procedure specifying the stage:
procedure.instance
  .inStage([Stage.ALLOCATION_ADJUSTMENT])
  .student.query(() => {});

// and N.B. that nonsense is not representable.
// You can't have a procedure in a group requiring subgroup perms,
// So the line below errors:
// procedure.group.subgroupAdmin;

//  -------------------------------------------

//* In terms of other big things,
// We've already isolated the business logic, but you may well want to test the tRPC procedures themselves.
// This is possible too, with a little refactoring. Here's a brief plan:
// To the base context, add a new object (I've been calling it "make")
// This object should have a factory function for each data object on it:
// e.g. make.user, make.admin, make.instance, etc...
// instead of calling new User, you call the corresponding factory function
// the make object can be injected when you construct the TRPC caller
// So to test the TRPC you can create a server-side caller
// and just call the methods on that in the tests

// How does this help?
// The factory function should have the same type as the constructor. e.g.
// make.Instance : (instanceParams) => AllocationInstance

// for the production versions, the fns should just be thin wrappers
// around the real object constructors

// for mocking however, we should instead *extend* the data objects, and call their constructors:
// make.Instance : (instanceParams) => MockAllocationInstance
// where MockAllocationInstance extends AllocationInstance
// We can then inject whatever logic we want - and avoid DB calls if required.

// There's a small wrinkle I will point out: many of the objects in the structure I have designed are co-constructed. For example, User objects have a toAdmin() method which calls the admin constructor.
// There are two solutions here:
// 1. inject the make object into the classes and call the corresponding factory
//      instead of the constructor directly
// 2. over-write the relevant methods in the mock classes so they call the constructors for the other mock objects.

// 1. *feels* cleaner to me, but also like it would involve some mess
// Which one you go for is probably just a matter of taste :shrug:

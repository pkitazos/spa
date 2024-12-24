/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

import { AllocationInstance, PrismaClient, User } from "@prisma/client";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z, ZodError } from "zod";

import { auth } from "@/lib/auth";
import { now } from "@/lib/utils/date/now";
import { Session } from "@/lib/validations/auth";
import {
  instanceParamsSchema,
  refinedSpaceParamsSchema,
} from "@/lib/validations/params";

import { checkAdminPermissions } from "./utils/admin/access";
import { isSuperAdmin } from "./utils/admin/is-super-admin";
import { getInstance } from "./utils/instance";
import { getAllUserRoles, getUserRole } from "./utils/instance/user-role";

import { db, Role } from "@/db";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: {
  headers: Headers;
  session: Session | null;
}) => {
  const session = opts.session ?? { user: await auth() };

  const source = opts.headers.get("x-trpc-source") ?? "unknown";
  const time = now();

  console.log(`>>> tRPC Request from ${source} by`, session.user, `at ${time}`);

  return {
    session,
    db,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the trpc api is initialized, connecting the context and
 * transformer
 */

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure;

/**
 * Middleware that enforces users are logged in before running the procedure.
 */
const authedMiddleware = t.middleware(({ ctx: { session }, next }) => {
  if (!session || !session.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User is not signed in",
    });
  }
  return next({ ctx: { session: { user: session.user } } });
});

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(authedMiddleware);

/**
 * Middleware that fetches the instance from the database and adds it to the context.
 */
export const instanceMiddleware = authedMiddleware.unstable_pipe(
  async ({ ctx, input, next }) => {
    const { params } = z.object({ params: instanceParamsSchema }).parse(input);
    const instance = await getInstance(ctx.db, params);

    return next({ ctx: { instance: { params, ...instance } } });
  },
);

/**
 * Middleware that fetches the user's role in the instance from the database and adds it to the context.
 */
const userRoleMiddleware = instanceMiddleware.unstable_pipe(
  async ({ ctx, next }) => {
    const role = await getUserRole(
      ctx.db,
      ctx.instance.params,
      ctx.session.user.id,
    );

    return next({ ctx: { session: { user: { ...ctx.session.user, role } } } });
  },
);

/**
 * Procedure containing the current instance in its context.
 */
export const instanceProcedure = protectedProcedure
  .input(z.object({ params: instanceParamsSchema }))
  .use(instanceMiddleware);

/**
 * Procedure aware of the current user's role.
 */
export const roleAwareProcedure = instanceProcedure.use(userRoleMiddleware);

export const multiRoleAwareProcedure = instanceProcedure.use(
  async ({ ctx, next }) => {
    const user = ctx.session.user;
    const roles = await getAllUserRoles(ctx.db, ctx.instance.params, user.id);
    return next({ ctx: { session: { user: { ...user, roles } } } });
  },
);

export type MultiRoleAwareContext = {
  session: { user: User & { roles: Set<Role> } };
  db: PrismaClient;
  instance: AllocationInstance;
};

/**
 * Procedure that enforces the user is a student.
 */
export const studentProcedure = instanceProcedure
  .use(userRoleMiddleware)
  .use(async ({ ctx, next }) => {
    const user = ctx.session.user;
    if (user.role !== Role.STUDENT) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User is not a Student",
      });
    }

    const { studentLevel, latestSubmissionDateTime } =
      await ctx.db.studentDetails.findFirstOrThrow({
        where: { userId: user.id },
      });

    return next({
      ctx: {
        session: {
          user: {
            ...user,
            role: user.role,
            studentLevel,
            latestSubmissionDateTime,
          },
        },
      },
    });
  });

/**
 * Procedure that enforces the user is a admin.
 */
export const adminProcedure = protectedProcedure
  .input(z.object({ params: refinedSpaceParamsSchema }))
  .use(async ({ ctx, input, next }) => {
    const user = ctx.session.user;
    const membership = await checkAdminPermissions(
      ctx.db,
      input.params,
      user.id,
    );

    if (!membership) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User is not an Admin",
      });
    }

    return next({ ctx: { session: { user: { ...user, role: Role.ADMIN } } } });
  });

/**
 * Procedure that enforces the user is an Instance admin.
 */
export const instanceAdminProcedure = adminProcedure
  .input(z.object({ params: instanceParamsSchema }))
  .use(instanceMiddleware);

/**
 * Procedure that enforces the user is a super-admin
 */
export const superAdminProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    const membership = await isSuperAdmin(ctx.db, ctx.session.user.id);

    if (!membership) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User is not a Super Admin",
      });
    }

    return next();
  },
);

export const projectProcedure = instanceProcedure
  .input(z.object({ projectId: z.string().optional() }))
  .use(async ({ ctx, next, input }) => {
    if (input.projectId) {
      const projectData = await ctx.db.project.findFirstOrThrow({
        where: { id: input.projectId },
        include: {
          flagOnProjects: {
            select: { flag: { select: { id: true, title: true } } },
          },
          tagOnProject: {
            select: { tag: { select: { id: true, title: true } } },
          },
        },
      });

      if (!projectData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }
      const { flagOnProjects, tagOnProject, ...rest } = projectData;
      const project = {
        ...rest,
        flags: flagOnProjects.map((f) => f.flag),
        tags: tagOnProject.map((t) => t.tag),
      };

      return next({ ctx: { project } });
    }
    return next();
  });

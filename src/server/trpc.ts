/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import { sendMail } from "@/emails";
import { Mailer } from "@/emails/mailer";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import z, { ZodError } from "zod";

import { db } from "@/db";

import { auth } from "@/lib/auth";
import { type Session } from "@/lib/auth/types";
import { type AuditFn, logger, LogLevels } from "@/lib/logging/logger";

const trpcLogger = logger.child({ service: "trpc" });

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
  const { real, mask: user } = await auth();

  if (!user) console.error("Failed to get user from auth()");
  const session = opts.session ?? { user };

  const source = opts.headers.get("x-trpc-source") ?? "unknown";
  trpcLogger.log(LogLevels.TRIVIAL, "tRPC Request", { source });

  const audit: AuditFn = function audit(message, ...meta) {
    const data = meta.reduce((acc, val) => ({ ...acc, ...val }), {
      authorizer: real,
      mask: user,
    });

    trpcLogger.log(LogLevels.AUDIT, message, data);
  };

  return {
    session,
    db,
    mailer: new Mailer(sendMail),
    logger: trpcLogger,
    audit,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the trpc api is initialized, connecting the context and
 * transformer
 */

export const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? z.treeifyError(error.cause) : null,
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

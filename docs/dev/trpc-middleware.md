# tRPC Middlewares

We recently redesigned our tRPC middlewares to make them more expressive. The new middlewares can be found in `/src/server/middleware.ts`.

There are two kinds of middlewares defined in that file: user and space middlewares.

Space middlewares require an input to specify which space they refer to - for example, the group middleware needs a group ID.

Given this however, it injects a group data object into the tRPC context. The other middlewares require similar inputs, and inject their own respective data objects into the context.

There is one special case: the stage middleware. The stage extends the instance middleware, and is a function - you pass it a list of stages and it checks that the instance is in one of the provided stages.

The user middlewares also inject data objects into the context. They generally specify different permission levels. For example, the sub-group admin requires the caller to specify a subgroup. But assuming that is done, it then checks that the user associated with the session is a sub-group admin or better.

These middlewares are still not intended for direct use in routers. Instead, we pre-compose them into a collection of procedures. This is the `procedure` object. This is indexed by space types, and then user type (though institution procedures are kept at the top level). This helps ensure that nonsense like attaching the subgroup-admin middleware to a group procedure doesn't happen.

When writing procedures, you should generally always use one of these pre-defined procedures types from the middleware file.

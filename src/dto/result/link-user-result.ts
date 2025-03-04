import { z } from "zod";

export const LinkUserResult = {
  /** Found a user and linked them */
  OK: "OK",
  /** Did not find a matching user;
   * created a new one and linked that */
  CREATED_NEW: "CREATED_NEW",
  /** Specified user was already linked */
  PRE_EXISTING: "PRE_EXISTING",
  /** Procedure failed */
  ERR: "ERR",
} as const;

export const LinkUserResultSchema = z.enum([
  LinkUserResult.OK,
  LinkUserResult.CREATED_NEW,
  LinkUserResult.PRE_EXISTING,
  LinkUserResult.ERR,
]);

export type LinkUserResult = z.infer<typeof LinkUserResultSchema>;

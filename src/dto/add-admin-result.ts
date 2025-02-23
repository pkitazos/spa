import { z } from "zod";

export const AddAdminResult = {
  /** Found a user and made them an admin */
  OK: "OK",
  /** Did not find a matching user;
   * created a new one and made them an admin */
  CREATED_NEW: "CREATED_NEW",
  /** Specified user was already an admin */
  PRE_EXISTING: "PRE_EXISTING",
  /** Procedure failed */
  ERR: "ERR",
} as const;

export const AddAdminResultSchema = z.enum([
  AddAdminResult.OK,
  AddAdminResult.CREATED_NEW,
  AddAdminResult.PRE_EXISTING,
  AddAdminResult.ERR,
]);

export type AddAdminResult = z.infer<typeof AddAdminResultSchema>;

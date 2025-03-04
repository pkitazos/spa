import { z } from "zod";

export const PermissionResult = {
  /** User had permission */
  OK: "OK",
  /** User did not have permission */
  UNAUTHORISED: "UNAUTHORISED",
};

export const permissionResultSchema = z.enum([
  PermissionResult.UNAUTHORISED,
  PermissionResult.OK,
]);

export type PermissionResult = z.infer<typeof permissionResultSchema>;

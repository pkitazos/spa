import { z } from "zod";

export const addStudentsCsvHeaders = [
  "fullName",
  "institutionId",
  "email",
  "flagId",
];

export const addSupervisorsCsvHeaders = [
  "fullName",
  "institutionId",
  "email",
  "projectTarget",
  "projectUpperQuota",
];

export const addStudentsCsvRowSchema = z.object({
  fullName: z.string("a valid Full Name"),
  institutionId: z.string("a valid Institution ID"),
  email: z.email("a valid Email"),
  flagId: z.string("a valid Flag ID"),
});

export const addSupervisorsCsvRowSchema = z
  .object({
    full_name: z.string("a valid Full Name"),
    guid: z.string("a valid GUID"),
    email: z.email("a valid Email"),
    project_target: z
      .number(" valid Target")
      .int("an integer Target value")
      .nonnegative("a non-negative Target value"),
    project_upper_quota: z
      .number("a valid Upper Quota")
      .int("an integer Upper Quota")
      .positive("a positive Upper Quota"),
  })
  .refine(
    ({ project_target, project_upper_quota }) =>
      project_target <= project_upper_quota,
    "a Target value less than or equal to the Upper Quota value",
  );

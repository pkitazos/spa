import { z } from "zod";

export const addStudentsCsvHeaders = [
  "full_name",
  "guid",
  "email",
  "student_level",
];

export const addSupervisorsCsvHeaders = [
  "full_name",
  "guid",
  "email",
  "project_target",
  "project_upper_quota",
];

export const addStudentsCsvRowSchema = z.object({
  full_name: z.string("a valid Full Name"),
  guid: z.string("a valid GUID"),
  email: z.email("a valid Email"),
  student_level: z
    .number("a valid Student Level")
    .int("an integer Student Level")
    .positive("a positive Student Level")
    .refine((level) => level === 4 || level === 5, "a valid Student Level"),
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

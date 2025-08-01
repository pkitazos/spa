import { z } from "zod";

import { type FlagDTO } from "@/dto";

export const baseNewStudentSchema = z.object({
  fullName: z
    .string("Please enter a valid name")
    .min(1, "Please enter a valid name"),
  institutionId: z
    .string("Please enter a valid institution ID")
    .min(1, "Please enter a valid institution ID"),
  email: z
    .email("Please enter a valid email address")
    .min(1, "Please enter a valid email address"),
  flagId: z
    .string("Please select a valid flag")
    .min(1, "Please select a valid flag"),
});

// for CSV parsing - validates the raw flag ID string
export const csvStudentSchema = baseNewStudentSchema;

// for form validation - validates flag ID exists in available flags
export function buildNewStudentSchema(flags: FlagDTO[]) {
  return baseNewStudentSchema.extend({
    flagId: z
      .string("Please select a valid flag")
      .refine((id) => flags.some((flag) => flag.id === id), {
        message: "Provided flag does not exist",
      }),
  });
}

export const newSupervisorSchema = z
  .object({
    fullName: z
      .string("Please enter a valid name")
      .min(1, "Please enter a valid name"),
    institutionId: z
      .string("Please enter a valid institution ID")
      .min(1, "Please enter a valid institution ID"),
    email: z
      .email("Please enter a valid email address")
      .min(1, "Please enter a valid email address"),
    projectTarget: z.coerce
      .number<number>({
        error: (issue) =>
          issue.input === undefined ? "Required" : "Invalid integer",
      })
      .int("Please enter an integer for the project target")
      .nonnegative("Project target must be a non-negative integer"),
    projectUpperQuota: z.coerce
      .number<number>({
        error: (issue) =>
          issue.input === undefined ? "Required" : "Invalid integer",
      })
      .int("Please enter an integer for the project upper quota")
      .positive("Project upper quota must be a positive integer"),
  })
  .refine(
    ({ projectTarget, projectUpperQuota }) =>
      projectTarget <= projectUpperQuota,
    {
      error: "Project target can't be greater than the project upper quota",
      path: ["projectTarget"],
    },
  );

export type NewStudent = z.infer<ReturnType<typeof buildNewStudentSchema>>;

export type NewSupervisor = z.infer<typeof newSupervisorSchema>;

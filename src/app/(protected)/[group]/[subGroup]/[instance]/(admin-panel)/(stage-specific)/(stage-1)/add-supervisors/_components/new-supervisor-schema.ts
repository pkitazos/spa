import { z } from "zod";

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
// for CSV parsing - validates supervisor data from CSV

export const csvSupervisorSchema = newSupervisorSchema;

export type NewSupervisor = z.infer<typeof newSupervisorSchema>;

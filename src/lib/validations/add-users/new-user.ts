import { z } from "zod";

export const newStudentSchema = z.object({
  fullName: z
    .string("Please enter a valid name")
    .min(1, "Please enter a valid name"),
  institutionId: z
    .string("Please enter a valid institution ID")
    .min(1, "Please enter a valid institution ID"),
  email: z
    .email("Please enter a valid email address")
    .min(1, "Please enter a valid email address"),
  level: z.coerce
    .number("Please enter a valid integer for the level")
    .int("Please enter a valid integer for the level")
    .refine((level) => level === 4 || level === 5, {
      message: "Level must be 4 or 5",
    }),
});

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
      .number({
        error: (issue) =>
          issue.input === undefined ? "Required" : "Invalid integer",
      })
      .int("Please enter an integer for the project target")
      .nonnegative("Project target must be a non-negative integer"),
    projectUpperQuota: z.coerce
      .number({
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
      message: "Project target can't be greater than the project upper quota",
      path: ["projectTarget"],
    },
  );

export type NewStudent = z.infer<typeof newStudentSchema>;

export type NewSupervisor = z.infer<typeof newSupervisorSchema>;

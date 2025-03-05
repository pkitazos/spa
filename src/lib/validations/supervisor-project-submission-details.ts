import { z } from "zod";

export const supervisorProjectSubmissionDetailsSchema = z.object({
  userId: z.string(),
  name: z.string(),
  email: z.string(),
  submittedProjectsCount: z.number(),
  projectAllocationTarget: z.number(),
  allocatedCount: z.number(),
  submissionTarget: z.number(),
});

export type SupervisorProjectSubmissionDetails = z.infer<
  typeof supervisorProjectSubmissionDetailsSchema
>;

export const supervisorCapacitiesSchema = z
  .object({
    projectTarget: z.coerce
      .number({
        required_error: "Required",
        invalid_type_error: "Invalid integer",
      })
      .int("Please enter an integer for the project target")
      .nonnegative("Project target must be a non-negative integer"),
    projectUpperQuota: z.coerce
      .number({
        required_error: "Required",
        invalid_type_error: "Invalid integer",
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

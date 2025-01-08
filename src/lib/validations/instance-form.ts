import { isAfter } from "date-fns";
import { z } from "zod";

const baseSchema = z.object({
  instanceName: z.string().min(1, "Please enter a name"),
  minPreferences: z.number(),
  maxPreferences: z.number(),
  maxPreferencesPerSupervisor: z.number(),
  preferenceSubmissionDeadline: z.date(),
  projectSubmissionDeadline: z.date(),
  markingSubmissionDeadline: z.date(),
  flags: z.array(
    z.object({ title: z.string().min(3, "Please enter a valid title") }),
  ),
  tags: z.array(
    z.object({ title: z.string().min(2, "Please enter a valid title") }),
  ),
});

export const createdInstanceSchema = baseSchema;

export const updatedInstanceSchema = baseSchema.omit({
  instanceName: true,
});

export type ValidatedInstanceDetails = z.infer<typeof baseSchema>;

export function buildInstanceFormSchema(takenNames: string[]) {
  return baseSchema
    .omit({
      minPreferences: true,
      maxPreferences: true,
      maxPreferencesPerSupervisor: true,
    })
    .extend({
      minPreferences: z.coerce
        .number({
          invalid_type_error: "Please enter an integer",
          required_error: "Please enter an integer",
        })
        .int({ message: "Number must be an integer" })
        .positive(),
      maxPreferences: z.coerce
        .number({
          invalid_type_error: "Please enter an integer",
          required_error: "Please enter an integer",
        })
        .int({ message: "Number must be an integer" })
        .positive(),
      maxPreferencesPerSupervisor: z.coerce
        .number({
          invalid_type_error: "Please enter an integer",
          required_error: "Please enter an integer",
        })
        .int({ message: "Number must be an integer" })
        .positive(),
    })
    .refine(({ flags }) => flags.length > 0, {
      message: "Please add at least one flag",
      path: ["flags.0.title"],
    })
    .refine(({ instanceName }) => !takenNames.includes(instanceName), {
      message: "This name is already taken",
      path: ["instanceName"],
    })
    .refine(
      ({ minPreferences, maxPreferences }) => minPreferences <= maxPreferences,
      {
        message:
          "Maximum Number of Preferences can't be less than Minimum Number of Preferences",
        path: ["maxPreferences"],
      },
    )
    .refine(
      ({ maxPreferences, maxPreferencesPerSupervisor }) =>
        maxPreferencesPerSupervisor <= maxPreferences,
      {
        message:
          "Maximum Number of Preferences per supervisor can't be more than Maximum Number of Preferences",
        path: ["maxPreferencesPerSupervisor"],
      },
    )
    .refine(
      ({ projectSubmissionDeadline, preferenceSubmissionDeadline }) =>
        isAfter(preferenceSubmissionDeadline, projectSubmissionDeadline),
      {
        message:
          "Preference Submission deadline can't be before Project Upload deadline",
        path: ["preferenceSubmissionDeadline"],
      },
    )
    .refine(
      ({ preferenceSubmissionDeadline, markingSubmissionDeadline }) =>
        isAfter(markingSubmissionDeadline, preferenceSubmissionDeadline),
      {
        message:
          "Marking Submission deadline can't be before Preference Submission deadline",
        path: ["markingSubmissionDeadline"],
      },
    )
    .refine(
      ({ flags }) => {
        const flagSet = new Set(flags.map(({ title }) => title));
        return flags.length === flagSet.size;
      },
      {
        message: "Flags must have distinct values",
        path: ["flags.0.title"],
      },
    );
}

const baseForkedSchema = z.object({
  instanceName: z.string().min(1, "Please enter a name"),
  preferenceSubmissionDeadline: z.date(),
  projectSubmissionDeadline: z.date(),
  markingSubmissionDeadline: z.date(),
});

export const forkedInstanceSchema = baseForkedSchema;

export type ForkedInstanceDetails = z.infer<typeof baseForkedSchema>;

export function buildForkedInstanceSchema(takenNames: string[]) {
  return baseForkedSchema
    .refine(({ instanceName }) => !takenNames.includes(instanceName), {
      message: "This name is already taken",
      path: ["instanceName"],
    })
    .refine(
      ({ projectSubmissionDeadline }) =>
        isAfter(projectSubmissionDeadline, new Date()),
      {
        message: "Project Submission Deadline must be after today",
        path: ["projectSubmissionDeadline"],
      },
    )
    .refine(
      ({ projectSubmissionDeadline, preferenceSubmissionDeadline }) =>
        isAfter(preferenceSubmissionDeadline, projectSubmissionDeadline),
      {
        message:
          "Preference Submission deadline can't be before Project Upload deadline",
        path: ["preferenceSubmissionDeadline"],
      },
    )
    .refine(
      ({ preferenceSubmissionDeadline, markingSubmissionDeadline }) =>
        isAfter(markingSubmissionDeadline, preferenceSubmissionDeadline),
      {
        message:
          "Marking Submission deadline can't be before Preference Submission deadline",
        path: ["projectSubmissionDeadline"],
      },
    );
}

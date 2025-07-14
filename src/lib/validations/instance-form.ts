import { isAfter } from "date-fns";
import { z } from "zod";

const baseSchema = z.object({
  displayName: z.string().min(1, "Please enter a name"),
  minStudentPreferences: z.number(),
  maxStudentPreferences: z.number(),
  maxStudentPreferencesPerSupervisor: z.number(),
  studentPreferenceSubmissionDeadline: z.date(),
  minReaderPreferences: z.number(),
  maxReaderPreferences: z.number(),
  readerPreferenceSubmissionDeadline: z.date(),
  projectSubmissionDeadline: z.date(),
  flags: z.array(
    z.object({
      title: z.string().min(3, "Please enter a valid title"),
      description: z.string().min(3, "Please enter a valid description"),
    }),
  ),
  tags: z.array(
    z.object({ title: z.string().min(2, "Please enter a valid title") }),
  ),
});

export const createdInstanceSchema = baseSchema;

/**
 * @deprecated
 */
export const updatedInstanceSchema = baseSchema.omit({ displayName: true });

/**
 * @deprecated
 */
export type UpdatedInstance = z.infer<typeof updatedInstanceSchema>;

export type ValidatedInstanceDetails = z.infer<typeof baseSchema>;

export function buildInstanceFormSchema(takenNames: Set<string>) {
  return baseSchema
    .omit({
      minStudentPreferences: true,
      maxStudentPreferences: true,
      maxStudentPreferencesPerSupervisor: true,
      minReaderPreferences: true,
      maxReaderPreferences: true,
    })
    .extend({
      minStudentPreferences: z.coerce
        .number("Please enter an integer")
        .int("Number must be an integer")
        .positive(),
      maxStudentPreferences: z.coerce
        .number("Please enter an integer")
        .int("Number must be an integer")
        .positive(),
      maxStudentPreferencesPerSupervisor: z.coerce
        .number("Please enter an integer")
        .int("Number must be an integer")
        .positive(),
      minReaderPreferences: z.coerce
        .number("Please enter an integer")
        .int("Number must be an integer")
        .positive(),
      maxReaderPreferences: z.coerce
        .number("Please enter an integer")
        .int("Number must be an integer")
        .positive(),
    })
    .refine(({ flags }) => flags.length > 0, {
      error: "Please add at least one flag",
      path: ["flags.0.title"],
    })
    .refine(({ displayName }) => !takenNames.has(displayName), {
      error: "This name is already taken",
      path: ["displayName"],
    })
    .refine((x) => x.minStudentPreferences <= x.maxStudentPreferences, {
      error:
        "Maximum Number of Preferences can't be less than Minimum Number of Preferences",
      path: ["maxStudentPreferences"],
    })
    .refine(
      (x) => x.maxStudentPreferencesPerSupervisor <= x.maxStudentPreferences,
      {
        error:
          "Maximum Number of Preferences per supervisor can't be more than Maximum Number of Preferences",
        path: ["maxStudentPreferencesPerSupervisor"],
      },
    )
    .refine(
      (x) =>
        isAfter(
          x.studentPreferenceSubmissionDeadline,
          x.projectSubmissionDeadline,
        ),
      {
        error:
          "Student Preference Submission deadline can't be before Project Upload deadline",
        path: ["studentPreferenceSubmissionDeadline"],
      },
    )
    .refine((x) => x.minReaderPreferences <= x.maxReaderPreferences, {
      error:
        "Maximum Number of Preferences can't be less than Minimum Number of Preferences",
      path: ["maxReaderPreferences"],
    })
    .refine(
      (x) =>
        isAfter(
          x.readerPreferenceSubmissionDeadline,
          x.studentPreferenceSubmissionDeadline,
        ),
      {
        error:
          "Reader Preference Submission deadline can't be before Student Preference Submission deadline",
        path: ["readerPreferenceSubmissionDeadline"],
      },
    )
    .refine(
      ({ flags }) => {
        const flagSet = new Set(flags.map(({ title }) => title));
        return flags.length === flagSet.size;
      },
      { error: "Flags must have distinct values", path: ["flags.0.title"] },
    );
}

const baseForkedSchema = z.object({
  displayName: z.string().min(1, "Please enter a name"),
  studentPreferenceSubmissionDeadline: z.date(),
  projectSubmissionDeadline: z.date(),
});

export const forkedInstanceSchema = baseForkedSchema;

export type ForkedInstanceDetails = z.infer<typeof baseForkedSchema>;

export function buildForkedInstanceSchema(takenNames: Set<string>) {
  return baseForkedSchema
    .refine((x) => !takenNames.has(x.displayName), {
      error: "This name is already taken",
      path: ["displayName"],
    })
    .refine((x) => isAfter(x.projectSubmissionDeadline, new Date()), {
      error: "Project Submission Deadline must be after today",
      path: ["projectSubmissionDeadline"],
    })
    .refine(
      (x) =>
        isAfter(
          x.studentPreferenceSubmissionDeadline,
          x.projectSubmissionDeadline,
        ),
      {
        error:
          "Preference Submission deadline can't be before Project Upload deadline",
        path: ["preferenceSubmissionDeadline"],
      },
    );
}

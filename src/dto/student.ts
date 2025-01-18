import { z } from "zod";

import { userDtoSchema } from ".";

export const studentDtoSchema = userDtoSchema.extend({
  level: z.number(),
  latestSubmissionDateTime: z.date().optional(),
});

export type StudentDTO = z.infer<typeof studentDtoSchema>;

export const studentDetailsDtoSchema = z.object({
  studentId: z.string(),
  level: z.number(),
  latestSubmissionDateTime: z.date().optional(),
});

export type StudentDetailsDTO = z.infer<typeof studentDetailsDtoSchema>;

export const studentPreferenceRestrictionsDtoSchema = z.object({
  minPreferences: z.number(),
  maxPreferences: z.number(),
  maxPreferencesPerSupervisor: z.number(),
  preferenceSubmissionDeadline: z.date(),
});

export type StudentPreferenceRestrictionsDTO = z.infer<
  typeof studentPreferenceRestrictionsDtoSchema
>;

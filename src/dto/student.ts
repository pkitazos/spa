import { z } from "zod";

import { DEPR_projectDtoSchema } from "./project";
import { flagDtoSchema, userDtoSchema } from ".";

import { DB_StudentDetails, PreferenceType } from "@/db/types";

//move to db/transformers
/**
 * @deprecated BAD
 */
export function toStudentDTO(data: DB_StudentDetails): DEPR_StudentDTO {
  return DEPR_studentDtoSchema.parse(data);
}
/**
 * @deprecated
 */
export const DEPR_studentDtoSchema = userDtoSchema.extend({
  level: z.number(),
  latestSubmissionDateTime: z.date().optional(),
});

/**
 * @deprecated
 */
export type DEPR_StudentDTO = z.infer<typeof DEPR_studentDtoSchema>;

/**
 * @deprecated user dto/user/student.ts instead
 */
export const studentDtoSchema = z.object({
  studentId: z.string(),
  level: z.number(),
  latestSubmissionDateTime: z.date().optional(),
  flags: z.array(flagDtoSchema),
});

/**
 * @deprecated user dto/user/student.ts instead
 */
export type StudentDTO = z.infer<typeof studentDtoSchema>;

//really, a slice of instance - so just use that
export const studentPreferenceRestrictionsDtoSchema = z.object({
  minPreferences: z.number(),
  maxPreferences: z.number(),
  maxPreferencesPerSupervisor: z.number(),
  preferenceSubmissionDeadline: z.date(),
});

export type StudentPreferenceRestrictionsDTO = z.infer<
  typeof studentPreferenceRestrictionsDtoSchema
>;

// TODO: review this schema
export const studentDraftPreferenceDtoSchema = z.object({
  project: DEPR_projectDtoSchema,
  score: z.number(),
  type: z.nativeEnum(PreferenceType),
  supervisor: userDtoSchema,
});

export type StudentDraftPreferenceDTO = z.infer<
  typeof studentDraftPreferenceDtoSchema
>;

// TODO: review this schema
export const studentSubmittedPreferenceDtoSchema = z.object({
  project: DEPR_projectDtoSchema,
  rank: z.number(),
  supervisor: userDtoSchema,
});

export type StudentSubmittedPreferenceDTO = z.infer<
  typeof studentSubmittedPreferenceDtoSchema
>;

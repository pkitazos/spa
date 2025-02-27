import { z } from "zod";

import { projectDtoSchema } from "./project";
import { userDtoSchema } from ".";

import { DB_StudentDetails, PreferenceType } from "@/db/types";

export function toStudentDTO(data: DB_StudentDetails): StudentDTO {
  return studentDtoSchema.parse(data);
}

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

// TODO: review this schema
export const studentDraftPreferenceDtoSchema = z.object({
  project: projectDtoSchema,
  score: z.number(),
  type: z.nativeEnum(PreferenceType),
  supervisor: userDtoSchema,
});

export type StudentDraftPreferenceDTO = z.infer<
  typeof studentDraftPreferenceDtoSchema
>;

// TODO: review this schema
export const studentSubmittedPreferenceDtoSchema = z.object({
  project: projectDtoSchema,
  rank: z.number(),
  supervisor: userDtoSchema,
});

export type StudentSubmittedPreferenceDTO = z.infer<
  typeof studentSubmittedPreferenceDtoSchema
>;

import { z } from "zod";

import { studentDtoSchema } from "@/dto";

import { PreferenceType } from "@/db/types";

export const savedPreferenceDto = z.object({
  id: z.string(),
  title: z.string(),
  supervisor: z.object({ id: z.string(), name: z.string() }),
  rank: z.number(),
});

export type SavedPreferenceDto = z.infer<typeof savedPreferenceDto>;

export const studentPreferenceSubmissionDto = z.object({
  student: studentDtoSchema,
  submissionCount: z.number(),
  submitted: z.boolean(),
  preAllocated: z.boolean(),
});

export type StudentPreferenceSubmissionDto = z.infer<
  typeof studentPreferenceSubmissionDto
>;

export const newProjectPreferenceDtoSchema = z.object({
  projectId: z.string(),
  preferenceType: z.nativeEnum(PreferenceType),
});

export type NewProjectPreferenceDto = z.infer<
  typeof newProjectPreferenceDtoSchema
>;

export const projectStudentDto = z.object({
  id: z.string(),
  name: z.string(),
  level: z.number(),
  type: z.nativeEnum(PreferenceType),
  rank: z.number(),
});

export type ProjectStudentDto = z.infer<typeof projectStudentDto>;

export type StudentPreferenceDto = {
  userId: string;
  projectId: string;
  rank: number;
};

export type SupervisorCentricPreferenceDto = StudentPreferenceDto & {
  supervisorId: string;
};

export type TagCentricPreferenceDto = StudentPreferenceDto & { tag: string };

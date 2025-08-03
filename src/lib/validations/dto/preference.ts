import { z } from "zod";

import { studentDtoSchema } from "@/dto";

import { PreferenceType } from "@/db/types";

// TODO: kill this file

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
  preferenceType: z.enum(PreferenceType),
});

export type NewProjectPreferenceDto = z.infer<
  typeof newProjectPreferenceDtoSchema
>;

export type StudentPreferenceDto = {
  userId: string;
  projectId: string;
  rank: number;
};

export type SupervisorCentricPreferenceDto = StudentPreferenceDto & {
  supervisorId: string;
};

export type TagCentricPreferenceDto = StudentPreferenceDto & { tag: string };

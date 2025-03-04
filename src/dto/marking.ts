import { MarkerType } from "@/db/types";
import { z } from "zod";

export const gradedSubmissionDtoSchema = z.object({
  id: z.string(),
  flagId: z.string(),
  title: z.string(),
  deadline: z.date(),
  weight: z.number(),
});

export type GradedSubmissionDTO = z.infer<typeof gradedSubmissionDtoSchema>;

export const assessmentComponentDtoSchema = z.object({
  flagId: z.string(),
  submissionId: z.string(),
  title: z.string(),
  description: z.string(),
  weight: z.number(),
  layoutIndex: z.number(),
  markerType: z.nativeEnum(MarkerType),
});

export type AssessmentComponentDTO = z.infer<
  typeof assessmentComponentDtoSchema
>;

export const submissionMarkerGradeDtoSchema = z.object({
  gradedSubmissionId: z.string(),
  markerId: z.string(),
  grade: z.string(),
});

export type SubmissionMarkerGradeDTO = z.infer<
  typeof submissionMarkerGradeDtoSchema
>;

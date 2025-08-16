import { z } from "zod";

import { MarkerType } from "@/db/types";

import { flagDtoSchema } from "./flag-tag";

// --- markscheme stuff:

export const assessmentCriterionDtoSchema = z.object({
  id: z.string(),
  unitOfAssessmentId: z.string(),
  title: z.string(),
  description: z.string(),
  weight: z.number(),
  layoutIndex: z.number(),
});

export type AssessmentCriterionDTO = z.infer<
  typeof assessmentCriterionDtoSchema
>;

export const unitOfAssessmentDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  studentSubmissionDeadline: z.date(),
  markerSubmissionDeadline: z.date(),
  weight: z.number(),
  isOpen: z.boolean(),
  components: z.array(assessmentCriterionDtoSchema),
  flag: flagDtoSchema,
  allowedMarkerTypes: z.array(z.enum(MarkerType)),
});

export type UnitOfAssessmentDTO = z.infer<typeof unitOfAssessmentDtoSchema>;

export const newUnitOfAssessmentSchema = z.object({
  title: z.string(),
  studentSubmissionDeadline: z.date(),
  markerSubmissionDeadline: z.date(),
  weight: z.number(),
  isOpen: z.boolean(),
  allowedMarkerTypes: z
    .union([z.literal("SUPERVISOR"), z.literal("READER")])
    .array(),
  components: z.array(
    z.object({
      title: z.string(),
      weight: z.number(),
      description: z.string(),
      layoutIndex: z.number(),
    }),
  ),
});

export type NewUnitOfAssessmentDTO = z.infer<typeof newUnitOfAssessmentSchema>;

// --- mark submission/grade stuff

export const criterionScoreDtoSchema = z.object({
  mark: z.number().int().nonnegative(),
  justification: z.string().min(1),
});

export type CriterionScoreDTO = z.infer<typeof criterionScoreDtoSchema>;

export const markingSubmissionDtoSchema = z.object({
  unitOfAssessmentId: z.string(),
  grade: z.number().int().nonnegative(),
  studentId: z.string(),
  markerId: z.string(),
  marks: z.record(
    z.string(), // assessmentCriterionId
    criterionScoreDtoSchema,
  ),
  finalComment: z.string(),
  recommendation: z.boolean(),
  draft: z.boolean(),
});

export type MarkingSubmissionDTO = z.infer<typeof markingSubmissionDtoSchema>;

export const partialMarkingSubmissionDtoSchema = markingSubmissionDtoSchema
  .partial({ finalComment: true, recommendation: true })
  .extend({
    grade: z.number().int(),
    marks: z
      .record(
        z.string(), // assessmentCriterionId
        z
          .object({ mark: z.number().int(), justification: z.string() })
          .partial(),
      )
      .optional(),
  });

export type PartialMarkingSubmissionDTO = z.infer<
  typeof partialMarkingSubmissionDtoSchema
>;

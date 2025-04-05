import { MarkerType } from "@prisma/client";
import { z } from "zod";
import { flagDtoSchema } from "./flag-tag";

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

export const criterionScoreDtoSchema = z.object({
  grade: z.number().int(),
  justification: z.string(),
});

export type CriterionScoreDTO = z.infer<typeof criterionScoreDtoSchema>;

export const assessmentCriterionWithScoreDtoSchema = z.object({
  criterion: assessmentCriterionDtoSchema,
  score: criterionScoreDtoSchema.optional(),
});

export type AssessmentCriterionWithScoreDTO = z.infer<
  typeof assessmentCriterionWithScoreDtoSchema
>;

export const unitOfAssessmentGradeDtoSchema = z.object({
  unitOfAssessmentId: z.string(),
  studentId: z.string(),
  marks: z.record(
    z.string(), // assessmentCriterionId
    z.object({
      mark: z.number().int().nonnegative(),
      justification: z.string().min(1),
    }),
  ),
  finalComment: z.string(),
  recommendation: z.boolean(),
  draft: z.boolean(),
});

export type UnitOfAssessmentGradeDTO = z.infer<
  typeof unitOfAssessmentGradeDtoSchema
>;

export const partialMarkDtoSchema = unitOfAssessmentGradeDtoSchema
  .partial({ finalComment: true, recommendation: true })
  .extend({
    marks: z
      .record(
        z.string(), // assessmentCriterionId
        z
          .object({ mark: z.number().int(), justification: z.string() })
          .partial(),
      )
      .optional(),
  });

export type PartialMarkDTO = z.infer<typeof partialMarkDtoSchema>;

export const unitOfAssessmentDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  studentSubmissionDeadline: z.date(),
  markerSubmissionDeadline: z.date(),
  weight: z.number(),
  isOpen: z.boolean(),
  components: z.array(assessmentCriterionDtoSchema),
  flag: flagDtoSchema,
  allowedMarkerTypes: z.array(z.nativeEnum(MarkerType)),
});

export type UnitOfAssessmentDTO = z.infer<typeof unitOfAssessmentDtoSchema>;

export const submissionMarkerGradeDtoSchema = z.object({
  gradedSubmissionId: z.string(),
  markerId: z.string(),
  grade: z.string(),
});

export type SubmissionMarkerGradeDTO = z.infer<
  typeof submissionMarkerGradeDtoSchema
>;

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

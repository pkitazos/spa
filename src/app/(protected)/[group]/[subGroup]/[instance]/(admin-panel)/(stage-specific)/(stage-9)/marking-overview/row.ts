import { markerTypeSchema } from "@/db/types";
import {
  projectDtoSchema,
  studentDtoSchema,
  unitOfAssessmentDtoSchema,
  userDtoSchema,
} from "@/dto";
import { z } from "zod";

export const GradingStatus = { MARKED: "MARKED", PENDING: "PENDING" } as const;

export const UnitGradingStatus = {
  MARKED: "MARKED",
  PENDING: "PENDING",
  NEGOTIATION: "NEGOTIATION",
  MODERATION: "MODERATION",
} as const;

const gradingStatusSchema = z.union([
  z.object({
    status: z.literal(GradingStatus.MARKED),
    grade: z.number(),
    comment: z.string(),
  }),
  z.object({ status: z.literal(GradingStatus.PENDING) }),
]);

export type GradingStatus = z.infer<typeof gradingStatusSchema>;

const unitGradingStatusSchema = z.union([
  z.object({ status: z.literal(UnitGradingStatus.MARKED), grade: z.number() }),
  z.object({ status: z.literal(UnitGradingStatus.PENDING) }),
  z.object({ status: z.literal(UnitGradingStatus.NEGOTIATION) }),
  z.object({ status: z.literal(UnitGradingStatus.MODERATION) }),
]);

export type UnitGradingStatus = z.infer<typeof unitGradingStatusSchema>;

export const markerStatusSummarySchema = z.object({
  marker: userDtoSchema,
  markerType: markerTypeSchema,
  status: gradingStatusSchema,
});

export type MarkerStatusSummary = z.infer<typeof markerStatusSummarySchema>;

export const unitMarkingSummarySchema = z.object({
  unit: unitOfAssessmentDtoSchema.omit({ components: true }),
  status: unitGradingStatusSchema,
  markers: z.array(markerStatusSummarySchema),
});
export type UnitMarkingSummary = z.infer<typeof unitMarkingSummarySchema>;

export const projectMarkingOverviewSchema = z.object({
  project: projectDtoSchema,
  student: studentDtoSchema,
  status: gradingStatusSchema,
  units: unitMarkingSummarySchema.array(),
});

export type ProjectMarkingOverview = z.infer<
  typeof projectMarkingOverviewSchema
>;

export const markingOverviewRowSchema = z.object({
  marker: markerStatusSummarySchema,
  unit: unitMarkingSummarySchema.omit({ markers: true }),
  project: projectMarkingOverviewSchema.omit({ units: true }),
});

export type MarkingOverviewRow = z.infer<typeof markingOverviewRowSchema>;

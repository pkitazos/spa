import { markerTypeSchema } from "@/db/types";
import {
  projectDtoSchema,
  studentDtoSchema,
  unitOfAssessmentDtoSchema,
  userDtoSchema,
} from "@/dto";
import { z } from "zod";

const gradingStatusSchema = z.union([
  z.object({ status: z.literal("MARKED"), grade: z.number() }),
  z.object({ status: z.literal("PENDING") }),
]);

const unitGradingStatusSchema = z.union([
  z.object({ status: z.literal("MARKED"), grade: z.number() }),
  z.object({ status: z.literal("PENDING") }),
  z.object({ status: z.literal("NEGOTIATION") }),
  z.object({ status: z.literal("MODERATION") }),
]);

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

export const markingOverviewRowSchema = z.object({
  project: projectDtoSchema,
  student: studentDtoSchema,
  status: gradingStatusSchema,
  units: unitMarkingSummarySchema.array(),
});

export type MarkingOverviewRow = z.infer<typeof markingOverviewRowSchema>;

import { z } from "zod";

export const GradingResult = {
  /** Marking process could be resolved automatically */
  AUTO_RESOLVED: "AUTO_RESOLVED",
  /** Marking process requires moderator intervention */
  MODERATE: "MODERATE",
  /** Insufficient data */
  INSUFFICIENT: "INSUFFICIENT",
} as const;

export const GradingResultSchema = z.enum([
  GradingResult.AUTO_RESOLVED,
  GradingResult.MODERATE,
  GradingResult.INSUFFICIENT,
]);

export type GradingResult = z.infer<typeof GradingResultSchema>;

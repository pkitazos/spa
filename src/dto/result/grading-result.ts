import { z } from "zod";

export const GradingResult = {
  /** Insufficient data */
  INSUFFICIENT: "INSUFFICIENT",
  /** Marking process could be resolved automatically */
  AUTO_RESOLVED: "AUTO_RESOLVED",
  /** Marking process requires moderator intervention */
  MODERATE: "MODERATE",
  /** Marking delta of 2; nearly in agreement */
  NEGOTIATE1: "NEGOTIATE1",
  /** Large marking delta */
  NEGOTIATE2: "NEGOTIATE2",
} as const;

export const GradingResultSchema = z.enum([
  GradingResult.AUTO_RESOLVED,
  GradingResult.MODERATE,
  GradingResult.INSUFFICIENT,
  GradingResult.NEGOTIATE1,
  GradingResult.NEGOTIATE2,
]);

export type GradingResult = z.infer<typeof GradingResultSchema>;

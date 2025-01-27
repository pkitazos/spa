import { Stage } from "@prisma/client";

import { stageOrd } from "@/db/types";
import { stageSchema } from "@/dto";

/**
 *
 * @param currentStage the current stage
 * @param minStage the minimum stage to compare against
 * @returns true if the current stage is greater than the minimum stage
 */
export function stageGt(currentStage: Stage, minStage: Stage) {
  return stageOrd[currentStage] > stageOrd[minStage];
}

/**
 *
 * @param currentStage the current stage
 * @param minStage the minimum stage to compare against
 * @returns true if the current stage is greater than or equal to the minimum stage
 */
export function stageGte(currentStage: Stage, minStage: Stage) {
  return stageOrd[currentStage] >= stageOrd[minStage];
}

/**
 *
 * @param currentStage the current stage
 * @param maxStage the maximum stage to compare against
 * @returns true if the current stage is less than the maximum stage
 */
export function stageLt(currentStage: Stage, maxStage: Stage) {
  return stageOrd[currentStage] < stageOrd[maxStage];
}

/**
 *
 * @param currentStage the current stage
 * @param maxStage the maximum stage to compare against
 * @returns true if the current stage is less than or equal to the maximum stage
 */
export function stageLte(currentStage: Stage, maxStage: Stage) {
  return stageOrd[currentStage] <= stageOrd[maxStage];
}

/**
 *
 * @param minStage the minimum stage to include in the returned array
 * @returns all stages that are after the `minStage` inclusive
 */
export function subsequentStages(minStage: Stage): Stage[] {
  return stageSchema.options.filter((s) => stageOrd[s] >= stageOrd[minStage]);
}

/**
 *
 * @param maxStage the maximum stage to include in the returned array
 * @returns all stages that are before the `maxStage` inclusive
 */
export function previousStages(maxStage: Stage): Stage[] {
  return stageSchema.options.filter((s) => stageOrd[s] <= stageOrd[maxStage]);
}

/**
 *
 * checks if the current stage is between the minimum and maximum stages
 * @param currentStage the current stage
 * @param minStage the minimum stage to compare against
 * @param maxStage the maximum stages to compare against
 * @returns true if the current stage is between the minimum and maximum stages
 */
export function stageIn(
  currentStage: Stage,
  [minStage, maxStage]: [Stage, Stage],
) {
  return stageGte(currentStage, minStage) && stageLt(currentStage, maxStage);
}

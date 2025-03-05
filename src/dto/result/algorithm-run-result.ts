import { z } from "zod";

export const AlgorithmRunResult = {
  /** Returned a valid matching */
  OK: "OK",
  /** Returned an empty matching */
  EMPTY: "EMPTY",
  /** Supplied instance is infeasible */
  INFEASIBLE: "INFEASIBLE",
  /** Procedure failed */
  ERR: "ERR",
} as const;

export const algorithmRunResultSchema = z.enum([
  AlgorithmRunResult.OK,
  AlgorithmRunResult.EMPTY,
  AlgorithmRunResult.INFEASIBLE,
  AlgorithmRunResult.ERR,
]);

export type AlgorithmRunResult = z.infer<typeof algorithmRunResultSchema>;

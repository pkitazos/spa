import { type AlgorithmDTO } from "@/dto";
import { type AlgorithmRunResult } from "@/dto/result/algorithm-run-result";

import {
  type MatchingDataDTO,
  type MatchingDataWithArgs,
} from "@/lib/validations/matching";

export interface MatchingServiceResponse {
  status: AlgorithmRunResult;
  data?: {
    profile: number[];
    degree: number;
    size: number;
    weight: number;
    cost: number;
    costSq: number;
    maxLecAbsDiff: number;
    sumLecAbsDiff: number;
    ranks: number[];
    matching: Array<{
      student_id: string;
      project_id: string;
      project_capacities: { lower_bound: number; upper_bound: number };
      preference_rank: number;
      supervisor_id: string;
      supervisor_capacities: {
        lower_bound: number;
        target: number;
        upper_bound: number;
      };
    }>;
  };
  error?: string;
}

export interface IMatchingService {
  executeAlgorithm(
    algorithm: AlgorithmDTO,
    matchingData: MatchingDataDTO | MatchingDataWithArgs,
  ): Promise<MatchingServiceResponse>;
}

export class MatchingServiceError extends Error {
  constructor(
    public readonly code: MatchingServiceErrorCode,
    message: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = "MatchingServiceError";
  }
}

export const MatchingServiceErrorCode = {
  CONNECTION_FAILED: "CONNECTION_FAILED",
  INVALID_RESPONSE: "INVALID_RESPONSE",
  ALGORITHM_FAILED: "ALGORITHM_FAILED",
} as const;

export type MatchingServiceErrorCode =
  (typeof MatchingServiceErrorCode)[keyof typeof MatchingServiceErrorCode];

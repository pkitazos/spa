import { type z } from "zod";

import { type AlgorithmDTO } from "@/dto";

import {
  type MatchingDataDTO,
  type matchingServiceResponseSchema,
} from "@/lib/validations/matching";

type MatchingServiceResponseData = z.infer<
  typeof matchingServiceResponseSchema
>["data"];

export type MatchingServiceResponse =
  | { status: "OK"; data: MatchingServiceResponseData; error?: never }
  | { status: "INFEASIBLE" | "EMPTY" | "ERR"; data?: never; error: string };

export interface IMatchingService {
  executeAlgorithm(
    algorithm: AlgorithmDTO,
    matchingData: MatchingDataDTO,
  ): Promise<MatchingServiceResponse>;
}

export const MatchingServiceErrorCode = {
  CONNECTION_FAILED: "CONNECTION_FAILED",
  INVALID_RESPONSE: "INVALID_RESPONSE",
  ALGORITHM_FAILED: "ALGORITHM_FAILED",
} as const;

export type MatchingServiceErrorCode =
  (typeof MatchingServiceErrorCode)[keyof typeof MatchingServiceErrorCode];

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

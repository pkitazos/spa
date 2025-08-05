import { env } from "@/env";
import axios from "axios";

import { type AlgorithmDTO, builtInAlgorithms } from "@/dto";
import { AlgorithmRunResult } from "@/dto/result/algorithm-run-result";

import { type AlgorithmFlag } from "@/db/types";

import {
  type MatchingDataDTO,
  type MatchingDataWithArgs,
  matchingServiceResponseSchema,
} from "@/lib/validations/matching";

import {
  type IMatchingService,
  type MatchingServiceResponse,
  MatchingServiceError,
  MatchingServiceErrorCode,
} from "./types";

export class HttpMatchingService implements IMatchingService {
  async executeAlgorithm(
    algorithm: AlgorithmDTO,
    matchingData: MatchingDataDTO | MatchingDataWithArgs,
  ): Promise<MatchingServiceResponse> {
    try {
      let endpoint = algorithm.id;
      let requestData = matchingData;

      if (
        !algorithm.builtIn &&
        !builtInAlgorithms.find((a) => a.displayName === algorithm.displayName)
      ) {
        endpoint = "";
        requestData = { ...matchingData, args: this.generateArgs(algorithm) };
      }

      const result = await axios
        .post(`${env.MATCHING_SERVER_URL}/${endpoint}`, requestData)
        .then((res) => matchingServiceResponseSchema.safeParse(res.data));

      if (!result.success) {
        throw new MatchingServiceError(
          MatchingServiceErrorCode.INVALID_RESPONSE,
          "Matching server did not return a valid response",
        );
      }

      const serverResponse = result.data;
      if (serverResponse.status === 400) {
        return {
          status: AlgorithmRunResult.INFEASIBLE,
          error: "Matching result is infeasible",
        };
      }

      const data = serverResponse.data;
      if (!data) {
        return {
          status: AlgorithmRunResult.EMPTY,
          error: "Matching server did not return any data",
        };
      }

      return { status: AlgorithmRunResult.OK, data };
    } catch (error) {
      if (error instanceof MatchingServiceError) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNREFUSED") {
          throw new MatchingServiceError(
            MatchingServiceErrorCode.CONNECTION_FAILED,
            "Unable to connect to matching service",
            error,
          );
        }
      }

      throw new MatchingServiceError(
        MatchingServiceErrorCode.ALGORITHM_FAILED,
        "Algorithm execution failed",
        error,
      );
    }
  }

  private toArg = (flag: AlgorithmFlag) => `-${flag.toLowerCase()}`;

  private generateArgs(algorithm: AlgorithmDTO) {
    const args = ["-na", "3", this.toArg(algorithm.flag1), "1"];

    if (algorithm.flag2) args.push(...[this.toArg(algorithm.flag2), "2"]);
    if (algorithm.flag3) args.push(...[this.toArg(algorithm.flag3), "3"]);

    return args;
  }
}

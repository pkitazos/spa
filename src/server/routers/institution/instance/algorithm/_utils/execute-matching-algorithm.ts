import axios from "axios";

import { builtInAlgSchema } from "@/lib/validations/algorithm";
import { AlgorithmDTO } from "@/dto";
import {
  MatchingDataDTO,
  MatchingDataWithArgs,
  matchingServiceResponseSchema,
} from "@/lib/validations/matching";

import { AlgorithmFlag } from "@/db/types";
import { AlgorithmRunResult } from "@/dto";
import { env } from "@/env";

// ? where should this live

export async function executeMatchingAlgorithm(
  algorithm: AlgorithmDTO,
  matchingData: MatchingDataDTO | MatchingDataWithArgs,
) {
  let endpoint = algorithm.id;

  if (!builtInAlgSchema.options.includes(algorithm.id)) {
    endpoint = "";
    matchingData = { ...matchingData, args: generateArgs(algorithm) };
  }

  const result = await axios
    .post(`${env.SERVER_URL}/${endpoint}`, matchingData)
    .then((res) => matchingServiceResponseSchema.safeParse(res.data));

  if (!result.success) {
    return {
      status: AlgorithmRunResult.ERR,
      error: "Matching server did not return a valid response",
    };
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
}

const toArg = (flag: AlgorithmFlag) => `-${flag.toLowerCase()}`;

function generateArgs(algorithm: AlgorithmDTO) {
  const args = ["-na", "3", toArg(algorithm.flag1), "1"];

  if (algorithm.flag2) args.push(...[toArg(algorithm.flag2), "2"]);
  if (algorithm.flag3) args.push(...[toArg(algorithm.flag3), "3"]);

  return args;
}

import { PrismaClient } from "@prisma/client";
import { z } from "zod";

import algorithmData from "./data/Algorithm.json";
import { expand } from "@/lib/utils/general/instance-params";

export async function algorithm_matching_results(db: PrismaClient) {
  const params = {
    group: "socs",
    subGroup: "lvl-4-and-lvl-5-honours",
    instance: "2024-2025",
  };

  const matchingResults = algorithmData.map((x) => {
    const rawData = JSON.parse(x.matching_result_data);
    const result = matchingResultSchema.parse(rawData);

    return {
      ...expand(params),
      algorithmId: x.alg_name,
      profile: result.profile,
      degree: result.degree,
      size: result.size,
      weight: result.weight,
      cost: result.cost,
      costSq: result.costSq,
      maxLecAbsDiff: result.maxLecAbsDiff,
      sumLecAbsDiff: result.sumLecAbsDiff,
      ranks: result.ranks,
    };
  });

  const matchingPairs = algorithmData.flatMap((x) => {
    const rawData = JSON.parse(x.matching_result_data);
    const result = matchingResultSchema.parse(rawData);

    return result.matching.map((m) => {
      return {
        algorithmId: x.alg_name,
        ...expand(params),
        projectId: m.project_id,
        userId: m.student_id,
        studentRanking: m.preference_rank,
      };
    });
  });

  await db.$transaction(async (tx) => {
    await tx.matchingResult.createMany({
      data: matchingResults,
      skipDuplicates: true,
    });

    const matching_results = await tx.matchingResult.findMany({});

    const algorithmIdToMatchingResultMap = matching_results.reduce(
      (acc, x) => ({ ...acc, [x.algorithmId]: x.id }),
      {} as Record<string, string>,
    );

    await tx.matchingPair.createMany({
      data: matchingPairs.map((x) => ({
        ...expand(params),
        projectId: x.projectId,
        userId: x.userId,
        studentRanking: x.studentRanking,
        matchingResultId: algorithmIdToMatchingResultMap[x.algorithmId],
      })),
      skipDuplicates: true,
    });
  });
}

export const matchingDetailsSchema = z.object({
  student_id: z.string(),
  project_id: z.string(),
  project_capacities: z.object({
    lower_bound: z.number().int(),
    upper_bound: z.number().int(),
  }),
  preference_rank: z.number().int(),
  supervisor_id: z.string(),
  supervisor_capacities: z.object({
    lower_bound: z.number().int(),
    target: z.number().int(),
    upper_bound: z.number().int(),
  }),
});

export const matchingResultSchema = z.object({
  profile: z.array(z.number()),
  degree: z.number(),
  size: z.number(),
  weight: z.number(),
  cost: z.number(),
  costSq: z.number(),
  maxLecAbsDiff: z.number(),
  sumLecAbsDiff: z.number(),
  matching: z.array(matchingDetailsSchema),
  ranks: z.array(z.number()),
});

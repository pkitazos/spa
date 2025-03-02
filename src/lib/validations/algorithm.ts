import { z } from "zod";

import { matchingResultDtoSchema } from "./matching";

import {
  GenerousAlgorithm,
  GreedyAlgorithm,
  GreedyGenAlgorithm,
  MinCostAlgorithm,
} from "@/config/algorithms";
import { AlgorithmFlag } from "@/db/types";
import { algorithmDtoSchema, AlgorithmDTO } from "../../dto/algorithm";

// TODO: centralise built-in algorithm names

export const algorithmFlagSchema = z.nativeEnum(AlgorithmFlag);

export const allFlags = [
  { label: "GRE", value: AlgorithmFlag.GRE },
  { label: "GEN", value: AlgorithmFlag.GEN },
  { label: "LSB", value: AlgorithmFlag.LSB },
  { label: "MAXSIZE", value: AlgorithmFlag.MAXSIZE },
  { label: "MINCOST", value: AlgorithmFlag.MINCOST },
  { label: "MINSQCOST", value: AlgorithmFlag.MINSQCOST },
] as const;

// TODO: derive this from existing algorithmSchema
export function buildNewAlgorithmSchema(takenNames: string[]) {
  // TODO: fix closure issue. takenNames are not updated when algorithms are deleted
  const allTakenNames = new Set([
    "Generous",
    "Greedy",
    "MinCost",
    "Greedy-Generous",
    ...takenNames,
  ]);

  return z.object({
    algName: z
      .string({ required_error: "Please select an Algorithm Name" })
      .refine((item) => !allTakenNames.has(item), "This name is already taken"),
    flag1: algorithmFlagSchema,
    flag2: algorithmFlagSchema.optional(),
    flag3: algorithmFlagSchema.optional(),
    targetModifier: z.coerce.number().int().nonnegative(),
    upperBoundModifier: z.coerce.number().int().nonnegative(),
    maxRank: z.coerce.number().int().positive().or(z.literal(-1)),
  });
}

// BREAKING
export const algorithmResultDtoSchema = z.object({
  algorithm: algorithmDtoSchema,
  matchingResults: matchingResultDtoSchema,
});

export type AlgorithmResultDTO = z.infer<typeof algorithmResultDtoSchema>;

export const builtInAlgorithms: AlgorithmDTO[] = [
  GenerousAlgorithm,
  GreedyAlgorithm,
  MinCostAlgorithm,
  GreedyGenAlgorithm,
];

export const builtInAlgSchema = z.enum([
  GenerousAlgorithm.id,
  GreedyAlgorithm.id,
  MinCostAlgorithm.id,
  GreedyGenAlgorithm.id,
]);

export type BuiltInAlg = z.infer<typeof builtInAlgSchema>;

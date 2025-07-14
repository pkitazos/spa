import { New } from "@/db/types";
import { AlgorithmFlag } from "@prisma/client";
import { z } from "zod";
import {
  GenerousAlgorithm,
  GreedyAlgorithm,
  GreedyGenAlgorithm,
  MinCostAlgorithm,
} from "@/config/algorithms";
import { matchingResultDtoSchema } from "@/lib/validations/matching";

export const algorithmFlagSchema = z.enum(AlgorithmFlag);

export const algorithmDtoSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  createdAt: z.date(),
  description: z.string().optional(),
  builtIn: z.boolean(),
  flag1: algorithmFlagSchema,
  flag2: algorithmFlagSchema.optional(),
  flag3: algorithmFlagSchema.optional(),
  targetModifier: z.number(),
  upperBoundModifier: z.number(),
  maxRank: z.number(),
});

export type AlgorithmDTO = z.infer<typeof algorithmDtoSchema>;

// TODO: centralise built-in algorithm names

export const allAlgorithmFlags = [
  { label: "GRE", value: AlgorithmFlag.GRE },
  { label: "GEN", value: AlgorithmFlag.GEN },
  { label: "LSB", value: AlgorithmFlag.LSB },
  { label: "MAXSIZE", value: AlgorithmFlag.MAXSIZE },
  { label: "MINCOST", value: AlgorithmFlag.MINCOST },
  { label: "MINSQCOST", value: AlgorithmFlag.MINSQCOST },
] as const;

// TODO: derive this from existing algorithmSchema
export function buildNewAlgorithmSchema(takenNames: Set<string>) {
  // TODO: fix closure issue. takenNames are not updated when algorithms are deleted
  const allTakenNames = new Set([
    "Generous",
    "Greedy",
    "MinCost",
    "Greedy-Generous",
    ...takenNames,
  ]);

  return z.object({
    displayName: z
      .string("Please select an Algorithm Name")
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

export const builtInAlgorithms: New<AlgorithmDTO>[] = [
  GenerousAlgorithm,
  GreedyAlgorithm,
  MinCostAlgorithm,
  GreedyGenAlgorithm,
];

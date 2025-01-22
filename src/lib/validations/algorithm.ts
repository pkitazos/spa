import { AlgorithmFlag } from "@prisma/client";
import { z } from "zod";

import {
  GenerousAlgorithm,
  GreedyAlgorithm,
  GreedyGenAlgorithm,
  MinCostAlgorithm,
} from "@/content/algorithms";

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

export const builtInAlgSchema = z.enum([
  "generous",
  "greedy",
  "minimum-cost",
  "greedy-generous",
]);

export type BuiltInAlg = z.infer<typeof builtInAlgSchema>;

export const algorithmSchema = z.object({
  algName: z.string(),
  displayName: z.string(),
  description: z.string(),
  flag1: algorithmFlagSchema,
  flag2: algorithmFlagSchema.nullable(),
  flag3: algorithmFlagSchema.nullable(),
  targetModifier: z.coerce.number().int().nonnegative(),
  upperBoundModifier: z.coerce.number().int().nonnegative(),
  maxRank: z.number().int().min(-1),
});

export type Algorithm = z.infer<typeof algorithmSchema>;

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
    maxRank: z.coerce.number().int().min(-1), //TODO: don't allow 0
  });
}

const algorithmDtoSchema = z.object({
  algName: z.string(),
  displayName: z.string(),
  description: z.string(),
  flags: z.array(z.nativeEnum(AlgorithmFlag)),
  targetModifier: z.number(),
  upperBoundModifier: z.number(),
  maxRank: z.number(),
});

export type AlgorithmDto = z.infer<typeof algorithmDtoSchema>;

export const algorithmResultDtoSchema = z.object({
  algName: z.string(),
  displayName: z.string(),
  weight: z.number(),
  size: z.number(),
  cost: z.number(),
  profile: z.array(z.number()),
});

export type AlgorithmResultDto = z.infer<typeof algorithmResultDtoSchema>;

export const builtInAlgorithms = [
  GenerousAlgorithm,
  GreedyAlgorithm,
  MinCostAlgorithm,
  GreedyGenAlgorithm,
];

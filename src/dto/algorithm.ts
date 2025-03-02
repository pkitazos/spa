import { z } from "zod";
import { algorithmFlagSchema } from "../lib/validations/algorithm";

export const algorithmDtoSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  createdAt: z.date(),
  description: z.string().optional(),
  flag1: algorithmFlagSchema,
  flag2: algorithmFlagSchema.optional(),
  flag3: algorithmFlagSchema.optional(),
  targetModifier: z.number(),
  upperBoundModifier: z.number(),
  maxRank: z.number(),
});

export type AlgorithmDTO = z.infer<typeof algorithmDtoSchema>;

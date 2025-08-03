import { z } from "zod";

import { flagDtoSchema } from "@/dto";

export const allocationCsvDataSchema = z.object({
  project: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    specialTechnicalRequirements: z.string(),
  }),
  student: z.object({
    id: z.string(),
    name: z.string(),
    matric: z.string(),
    email: z.string(),
    flag: flagDtoSchema,
    ranking: z.number(),
  }),
  supervisor: z.object({ id: z.string(), name: z.string(), email: z.string() }),
});

export type AllocationCsvData = z.infer<typeof allocationCsvDataSchema>;

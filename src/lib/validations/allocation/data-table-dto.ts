import { projectDtoSchema } from "@/dto/project";
import { z } from "zod";

export const allocationByStudentDtoSchema = z.object({
  student: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    ranking: z.number(),
  }),
  project: z.object({ id: z.string(), title: z.string() }),
  supervisor: z.object({ id: z.string(), name: z.string() }),
});

export type AllocationByStudentDto = z.infer<
  typeof allocationByStudentDtoSchema
>;

export const allocationByProjectDtoSchema = z.object({
  project: z.object({
    id: z.string(),
    title: z.string(),
    capacityLowerBound: z.number(),
    capacityUpperBound: z.number(),
  }),
  supervisor: z.object({ id: z.string(), name: z.string() }),
  student: z.object({ id: z.string(), name: z.string(), ranking: z.number() }),
});

export type AllocationByProjectDto = z.infer<
  typeof allocationByProjectDtoSchema
>;

export const allocationBySupervisorDtoSchema = z.object({
  supervisor: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    allocationLowerBound: z.number(),
    allocationTarget: z.number(),
    allocationUpperBound: z.number(),
  }),
  project: z.object({ id: z.string(), title: z.string() }),
  student: z.object({ id: z.string(), name: z.string(), ranking: z.number() }),
});

export type AllocationBySupervisorDto = z.infer<
  typeof allocationBySupervisorDtoSchema
>;

export const studentProjectAllocationDtoSchema = z.object({
  project: projectDtoSchema,
  rank: z.number(),
});

export type StudentProjectAllocationDto = z.infer<
  typeof studentProjectAllocationDtoSchema
>;

export const randomAllocationDtoSchema = z.object({
  student: z.object({ id: z.string(), name: z.string(), level: z.number() }),
  project: z.object({ id: z.string(), title: z.string() }).optional(),
});

export type RandomAllocationDto = z.infer<typeof randomAllocationDtoSchema>;

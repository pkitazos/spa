import { z } from "zod";
import { flagDtoSchema, tagDtoSchema } from "./flag-tag";

export const projectDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  specialTechnicalRequirements: z.string().optional(),
  preAllocatedStudentId: z.string().optional(),
  latestEditDateTime: z.date(),
  capacityLowerBound: z.number(),
  capacityUpperBound: z.number(),
  supervisorId: z.string(),
  flags: z.array(flagDtoSchema),
  tags: z.array(tagDtoSchema),
});

export type ProjectDTO = z.infer<typeof projectDtoSchema>;

export const ProjectAllocationStatus = {
  UNALLOCATED: "UNALLOCATED",
  PRE_ALLOCATED: "PRE_ALLOCATED",
  ALGORITHMICALLY_ALLOCATED: "ALGORITHMICALLY_ALLOCATED",
  MANUALLY_ALLOCATED: "MANUALLY_ALLOCATED",
} as const;

export type ProjectAllocationStatus =
  (typeof ProjectAllocationStatus)[keyof typeof ProjectAllocationStatus];

export const projectAllocationStatusSchema = z.enum([
  ProjectAllocationStatus.UNALLOCATED,
  ProjectAllocationStatus.MANUALLY_ALLOCATED,
  ProjectAllocationStatus.ALGORITHMICALLY_ALLOCATED,
  ProjectAllocationStatus.PRE_ALLOCATED,
]);

export const projectStatusRank = {
  [ProjectAllocationStatus.UNALLOCATED]: 0,
  [ProjectAllocationStatus.MANUALLY_ALLOCATED]: 1,
  [ProjectAllocationStatus.ALGORITHMICALLY_ALLOCATED]: 2,
  [ProjectAllocationStatus.PRE_ALLOCATED]: 3,
};

export const updateProjectSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  /** set null to erase  */
  specialTechnicalRequirements: z.string().nullable().optional(),
  /** set null to erase  */
  preAllocatedStudentId: z.string().nullable().optional(),
  isPreAllocated: z.boolean().optional(),
  capacityLowerBound: z.number().optional(),
  capacityUpperBound: z.number().optional(),
  supervisorId: z.string().optional(),
  flags: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

export type UpdateProjectDTO = z.infer<typeof updateProjectSchema>;

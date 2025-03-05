import { z } from "zod";
import { flagDtoSchema, tagDtoSchema } from ".";

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

export const updateProjectSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  /** set null to erase  */
  specialTechnicalRequirements: z.string().nullable().optional(),
  /** set null to erase  */
  preAllocatedStudentId: z.string().nullable().optional(),
  capacityLowerBound: z.number().optional(),
  capacityUpperBound: z.number().optional(),
  supervisorId: z.string().optional(),
  flags: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

export type UpdateProjectDTO = z.infer<typeof updateProjectSchema>;

/**
 * @deprecated
 */
export const DEPR_projectDtoSchema = projectDtoSchema.extend({
  supervisorId: z.string(),
});

/**
 * @deprecated use ProjectDetailsDTO instead (and eventually rename it to ProjectDTO)
 */
export type DEPR_ProjectDTO = z.infer<typeof DEPR_projectDtoSchema>;

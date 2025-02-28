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
  flags: z.array(flagDtoSchema),
  tags: z.array(tagDtoSchema),
});

export type ProjectDTO = z.infer<typeof projectDtoSchema>;

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

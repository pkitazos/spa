import { z } from "zod";

export const projectDetailsDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  specialTechnicalRequirements: z.string().optional(),
  preAllocatedStudentId: z.string().optional(),
  latestEditDateTime: z.date(),
  capacityLowerBound: z.number(),
  capacityUpperBound: z.number(),
});

export type ProjectDetailsDTO = z.infer<typeof projectDetailsDtoSchema>;

export const projectDtoSchema = projectDetailsDtoSchema.extend({
  supervisorId: z.string(),
});

export type ProjectDTO = z.infer<typeof projectDtoSchema>;

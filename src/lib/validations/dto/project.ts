import { z } from "zod";

import { TagType, tagTypeSchema } from "@/components/tag/tag-input";

/**
 * @deprecated
 */
export const DEPR_projectDtoSchema = z.object({
  title: z.string(),
  description: z.string(),
  supervisor: z.object({ id: z.string(), name: z.string() }),
  capacityUpperBound: z.number(),
  preAllocatedStudentId: z.string().or(z.null()), // TODO: change to undefined
  specialTechnicalRequirements: z.string(),
  flags: z.array(tagTypeSchema),
  tags: z.array(tagTypeSchema),
});

export type DEPR_ProjectDto = z.infer<typeof DEPR_projectDtoSchema>;

export const projectTableDataDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  specialTechnicalRequirements: z.string(),
  supervisor: z.object({ id: z.string(), name: z.string(), email: z.string() }),
  flags: z.array(z.object({ id: z.string(), title: z.string() })),
  tags: z.array(z.object({ id: z.string(), title: z.string() })),
});

export type ProjectTableDataDto = z.infer<typeof projectTableDataDtoSchema>;

export const lateProjectDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  supervisorId: z.string(),
  flags: z.array(tagTypeSchema),
  capacityUpperBound: z.number(),
});

export type LateProjectDto = z.infer<typeof lateProjectDtoSchema>;

export const projectSubmissionDtoSchema = z.object({
  name: z.string(),
  email: z.string(),
  userId: z.string(),
  submittedProjectsCount: z.number(),
  submissionTarget: z.number(),
  targetMet: z.boolean(),
});

export type ProjectSubmissionDto = z.infer<typeof projectSubmissionDtoSchema>;

export const newStudentProjectDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  flags: z.array(tagTypeSchema),
});

export type NewStudentProjectDto = z.infer<typeof newStudentProjectDtoSchema>;

export const preAllocatedProjectDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  supervisor: z.object({ id: z.string(), name: z.string() }),
  student: z.object({ id: z.string(), name: z.string() }),
  flags: z.array(tagTypeSchema),
  tags: z.array(tagTypeSchema),
});

export type PreAllocatedProjectDto = z.infer<
  typeof preAllocatedProjectDtoSchema
>;

export type SupervisorProjectDto = {
  id: string;
  title: string;
  supervisorId: string;
  preAllocatedStudentId: string | undefined;
  allocatedStudents: { id: string; name: string }[];
  flags: TagType[];
  tags: TagType[];
};

import { z } from "zod";
import { TagType, tagTypeSchema } from "@/components/tag/tag-input";

// TODO: deprecate this whole file

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

export const newStudentProjectDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  flags: z.array(tagTypeSchema),
});

export type NewStudentProjectDto = z.infer<typeof newStudentProjectDtoSchema>;

export type SupervisorProjectDto = {
  id: string;
  title: string;
  supervisorId: string;
  preAllocatedStudentId: string | undefined;
  allocatedStudents: { id: string; name: string }[];
  flags: TagType[];
  tags: TagType[];
};

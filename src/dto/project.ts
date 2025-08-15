import { z } from "zod";

import { AllocationMethod } from "@/db/types";

import { flagDtoSchema, tagDtoSchema } from "./flag-tag";
import { studentDtoSchema, supervisorDtoSchema } from "./user";

export const projectDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
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
  ...AllocationMethod,
  UNALLOCATED: "UNALLOCATED",
} as const;

export type ProjectAllocationStatus =
  (typeof ProjectAllocationStatus)[keyof typeof ProjectAllocationStatus];

export const projectAllocationStatusSchema = z.enum([
  ProjectAllocationStatus.UNALLOCATED,
  ProjectAllocationStatus.RANDOM,
  ProjectAllocationStatus.MANUAL,
  ProjectAllocationStatus.ALGORITHMIC,
  ProjectAllocationStatus.PRE_ALLOCATED,
]);

export const projectStatusRank = {
  [ProjectAllocationStatus.UNALLOCATED]: 0,
  [ProjectAllocationStatus.RANDOM]: 1,
  [ProjectAllocationStatus.MANUAL]: 2,
  [ProjectAllocationStatus.ALGORITHMIC]: 3,
  [ProjectAllocationStatus.PRE_ALLOCATED]: 4,
};

const formInternalStateSchema = z
  .object({
    title: z.string().min(4, "Please enter a longer title"),
    description: z.string().min(10, "Please enter a longer description"),
    flags: z
      .array(
        z.object({
          id: z.string(),
          displayName: z.string(),
          description: z.string(),
        }),
      )
      .min(1, "You must select at least one flag"),
    tags: z
      .array(z.object({ id: z.string(), title: z.string() }))
      .min(1, "You must select at least one tag"),
    capacityUpperBound: z.coerce.number<number>().int().positive().default(1),
    isPreAllocated: z.boolean().default(false),
    preAllocatedStudentId: z.string().optional(),
    supervisorId: z.string().optional(),
  })
  .refine((data) => !data.isPreAllocated || !!data.preAllocatedStudentId, {
    error: "A student ID must be provided", // TODO wording @pkitazos
    path: ["preAllocatedStudentId"],
  });

const buildInternalStateSchema = (takenTitles: Set<string>) =>
  formInternalStateSchema.refine((data) => !takenTitles.has(data.title), {
    error: "A project with this title already exists",
    path: ["title"],
  });

type ProjectFormInternalStateDTO = z.infer<typeof formInternalStateSchema>;

const submissionSchema = z.object({
  title: z.string(),
  description: z.string(),

  flags: z.array(flagDtoSchema),
  tags: z.array(tagDtoSchema),

  capacityUpperBound: z.number().int().positive(),
  preAllocatedStudentId: z.string().optional(),
  supervisorId: z.string().optional(),
});

type ProjectFormSubmissionDTO = z.infer<typeof submissionSchema>;

const createApiInputSchema = z.object({
  title: z.string(),
  description: z.string(),

  flagIds: z.array(z.string()),
  tagIds: z.array(z.string()),

  capacityUpperBound: z.number().int().positive(),
  preAllocatedStudentId: z.string().optional(),

  supervisorId: z.string(),
});

type ProjectFormCreateApiInputDTO = z.infer<typeof createApiInputSchema>;

const editApiInputSchema = createApiInputSchema.extend({ id: z.string() });

type ProjectFormEditApiInputDTO = z.infer<typeof editApiInputSchema>;

const projectCreationContextSchema = z.object({
  flags: z.array(flagDtoSchema),
  tags: z.array(tagDtoSchema),
  students: z.array(studentDtoSchema),
  supervisors: z.array(supervisorDtoSchema),
  takenTitles: z.set(z.string()),
});

type ProjectCreationContext = z.infer<typeof projectCreationContextSchema>;

export const projectForm = {
  buildInternalStateSchema,
  submissionSchema,
  createApiInputSchema,
  editApiInputSchema,
  initialisationSchema: projectCreationContextSchema,
};

export type {
  ProjectFormInternalStateDTO,
  ProjectFormSubmissionDTO,
  ProjectFormCreateApiInputDTO,
  ProjectFormEditApiInputDTO,
  ProjectCreationContext,
};

export const formToApiTransformations = {
  submissionToCreateApi: (
    data: ProjectFormSubmissionDTO,
    currentUserId: string,
  ): ProjectFormCreateApiInputDTO => ({
    title: data.title,
    description: data.description,

    capacityUpperBound: data.capacityUpperBound,
    preAllocatedStudentId: data.preAllocatedStudentId,

    flagIds: data.flags.map((f) => f.id),
    tagIds: data.tags.map((t) => t.id),
    supervisorId: data.supervisorId ?? currentUserId,
  }),

  submissionToEditApi: (
    data: ProjectFormSubmissionDTO,
    projectId: string,
    currentUserId: string,
  ): ProjectFormEditApiInputDTO => ({
    ...formToApiTransformations.submissionToCreateApi(data, currentUserId),
    id: projectId,
  }),
};

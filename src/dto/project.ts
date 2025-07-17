import { z } from "zod";

import { AllocationMethod } from "@/db/types";

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
    specialTechnicalRequirements: z.string().optional(),
    flags: z
      .array(z.object({ id: z.string(), title: z.string() }))
      .min(1, "You must select at least one flag"),
    tags: z
      .array(z.object({ id: z.string(), title: z.string() }))
      .min(1, "You must select at least one tag"),
    capacityUpperBound: z.coerce.number().int().positive().default(1),
    isPreAllocated: z.boolean().default(false),
    preAllocatedStudentId: z.string().optional(),
    supervisorId: z.string().optional(),
  })
  .refine((data) => !data.isPreAllocated || !!data.preAllocatedStudentId, {
    message: "A student ID must be provided", // TODO wording @pkitazos
    path: ["preAllocatedStudentId"],
  });

const buildInternalStateSchema = (takenTitles: Set<string>) =>
  formInternalStateSchema.refine((data) => !takenTitles.has(data.title), {
    message: "A project with this title already exists",
    path: ["title"],
  });

type ProjectFormInternalStateDTO = z.infer<typeof formInternalStateSchema>;

const submissionSchema = z.object({
  title: z.string(),
  description: z.string(),
  specialTechnicalRequirements: z.string().optional(),

  flags: z.array(z.object({ id: z.string(), title: z.string() })),
  tags: z.array(z.object({ id: z.string(), title: z.string() })),

  capacityUpperBound: z.number().int().positive(),
  preAllocatedStudentId: z.string().optional(),
  supervisorId: z.string().optional(),
});

type ProjectFormSubmissionDTO = z.infer<typeof submissionSchema>;

const createApiInputSchema = z.object({
  title: z.string(),
  description: z.string(),
  specialTechnicalRequirements: z.string().optional(),

  flagIds: z.array(z.string()),
  tagIds: z.array(z.string()),

  capacityUpperBound: z.number().int().positive(),
  preAllocatedStudentId: z.string().optional(),

  supervisorId: z.string(),
});

type ProjectFormCreateApiInputDTO = z.infer<typeof createApiInputSchema>;

const editApiInputSchema = createApiInputSchema.extend({ id: z.string() });

type ProjectFormEditApiInputDTO = z.infer<typeof editApiInputSchema>;

const initialisationSchema = z.object({
  flags: z.array(z.object({ id: z.string(), title: z.string() })),
  tags: z.array(z.object({ id: z.string(), title: z.string() })),
  studentIds: z.array(z.string()),
  supervisorIds: z.array(z.string()),

  takenTitles: z.set(z.string()),

  currentProject: editApiInputSchema.optional(),
});

type ProjectFormInitialisationDTO = z.infer<typeof initialisationSchema>;

export const projectForm = {
  buildInternalStateSchema,
  submissionSchema,
  createApiInputSchema,
  editApiInputSchema,
  initialisationSchema,
};

export type {
  ProjectFormInternalStateDTO,
  ProjectFormSubmissionDTO,
  ProjectFormCreateApiInputDTO,
  ProjectFormEditApiInputDTO,
  ProjectFormInitialisationDTO,
};

export const formToApiTransformations = {
  submissionToCreateApi: (
    data: ProjectFormSubmissionDTO,
    currentUserId: string,
  ): ProjectFormCreateApiInputDTO => ({
    title: data.title,
    description: data.description,
    specialTechnicalRequirements: data.specialTechnicalRequirements,

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

  initialisationToDefaultValues: (
    initialisationData: ProjectFormInitialisationDTO,
  ): Partial<ProjectFormInternalStateDTO> | undefined => {
    const { currentProject } = initialisationData;
    if (!currentProject) return undefined;

    return {
      title: currentProject.title,
      description: currentProject.description,
      specialTechnicalRequirements: currentProject.specialTechnicalRequirements,
      supervisorId: currentProject.supervisorId,

      flags: initialisationData.flags.filter((flag) =>
        currentProject.flagIds.includes(flag.id),
      ),
      tags: initialisationData.tags.filter((tag) =>
        currentProject.tagIds.includes(tag.id),
      ),

      isPreAllocated: !!currentProject.preAllocatedStudentId,
      preAllocatedStudentId: currentProject.preAllocatedStudentId,

      capacityUpperBound: currentProject.capacityUpperBound,
    };
  },
};

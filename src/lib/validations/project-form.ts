import { z } from "zod";

const formInternalStateSchema = z.object({
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
});

const buildProjectFormInternalStateSchema = (takenTitles: Set<string>) =>
  formInternalStateSchema.refine((data) => !takenTitles.has(data.title), {
    message: "A project with this title already exists",
    path: ["title"],
  });

type FormInternalStateData = z.infer<typeof formInternalStateSchema>;

const formSubmissionSchema = z.object({
  title: z.string(),
  description: z.string(),
  specialTechnicalRequirements: z.string().optional(),

  flags: z.array(z.object({ id: z.string(), title: z.string() })),
  tags: z.array(z.object({ id: z.string(), title: z.string() })),

  capacityUpperBound: z.number().int().positive(),
  preAllocatedStudentId: z.string().optional(),

  supervisorId: z.string().optional(),
});

type FormSubmissionData = z.infer<typeof formSubmissionSchema>;

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

type CreateApiInputData = z.infer<typeof createApiInputSchema>;

const editApiInputSchema = createApiInputSchema.extend({ id: z.string() });

type EditApiInputData = z.infer<typeof editApiInputSchema>;

const formInitialisationSchema = z.object({
  flags: z.array(z.object({ id: z.string(), title: z.string() })),
  tags: z.array(z.object({ id: z.string(), title: z.string() })),
  studentIds: z.array(z.string()),
  supervisorIds: z.array(z.string()),

  takenTitles: z.set(z.string()),

  currentProject: editApiInputSchema.optional(),
});

type FormInitialisationData = z.infer<typeof formInitialisationSchema>;

export {
  buildProjectFormInternalStateSchema,
  formInternalStateSchema as projectFormInternalStateSchema,
  formSubmissionSchema as projectFormSubmissionSchema,
  createApiInputSchema as projectFormCreateApiInputSchema,
  editApiInputSchema as projectFormEditApiInputSchema,
  formInitialisationSchema as projectFormInitialisationSchema,
};

export type {
  FormInternalStateData as ProjectFormInternalStateData,
  FormSubmissionData as ProjectFormSubmissionData,
  CreateApiInputData as ProjectFormCreateApiInput,
  EditApiInputData as ProjectFormEditApiInput,
  FormInitialisationData as ProjectFormInitialisationData,
};

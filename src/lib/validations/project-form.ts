import { z } from "zod";

import { tagTypeSchema } from "@/components/tag/tag-input";

import { projectFlags } from "@/config/config/flags";
import { FlagDTO, StudentDTO, TagDTO } from "@/dto";

/**
 * @deprecated
 */
const DEPR_baseProjectFormSchema = z.object({
  title: z.string().min(4, "Please enter a longer title"),
  description: z.string().min(10, "Please enter a longer description"),
  flagTitles: z
    .array(z.string())
    .refine((value) => value.some((item) => item), {
      message: "You have to select at least one flag for a project.",
    }),
  tags: z.array(z.object({ id: z.string(), title: z.string() })),
  isPreAllocated: z.boolean().default(false),
  capacityUpperBound: z.coerce.number().int().positive().default(1),
  preAllocatedStudentId: z.string().optional(),
  specialTechnicalRequirements: z.string().optional(),
});

/**
 * @deprecated
 */
export const DEPR_updatedProjectSchema = DEPR_baseProjectFormSchema.refine(
  ({ isPreAllocated, preAllocatedStudentId }) => {
    // if pre-allocated is enabled, student ID must be provided and non-empty
    if (isPreAllocated) {
      return preAllocatedStudentId && preAllocatedStudentId.trim() !== "";
    }
    // if pre-allocated is disabled, student ID should be empty or undefined
    return true;
  },
  { message: "Please select a student", path: ["preAllocatedStudentId"] },
);

/**
 * @deprecated
 */
export type UpdatedProject = z.infer<typeof DEPR_updatedProjectSchema>;

/**
 * @deprecated
 */
export function DEPR_buildUpdatedProjectSchema(
  takenTitles: Set<string>,
  requiredFlags: string[] = [],
) {
  return DEPR_updatedProjectSchema.refine(
    ({ title }) => !takenTitles.has(title),
    { message: "This title is already taken", path: ["title"] },
  ).refine(
    ({ flagTitles }) => {
      if (requiredFlags.length === 0) return true;
      return flagTitles.some((title) => requiredFlags.includes(title));
    },
    {
      message: `Must select at least one of "${projectFlags.level4}" or "${projectFlags.level5}"`,
      path: ["flagTitles"],
    },
  );
}

/**
 * @deprecated
 */
export const DEPR_currentProjectFormDetailsSchema =
  DEPR_baseProjectFormSchema.omit({
    capacityUpperBound: true,
    preAllocatedStudentId: true,
  }).extend({
    id: z.string(),
    capacityUpperBound: z.number(),
    preAllocatedStudentId: z.string(),
  });

/**
 * @deprecated
 */
export type CurrentProjectFormDetails = z.infer<
  typeof DEPR_currentProjectFormDetailsSchema
>;

/**
 * @deprecated
 */
const DEPR_formInternalDataSchema = z.object({
  takenTitles: z.array(z.string()),
  flags: z.array(z.object({ id: z.string(), title: z.string() })),
  tags: z.array(tagTypeSchema),
  students: z.array(z.object({ id: z.string() })),
});

/**
 * @deprecated
 */
export type DEPR_FormInternalData = {
  flags: FlagDTO[];
  tags: TagDTO[];
  students: StudentDTO[];
  takenTitles: Set<string>;
};

// ----

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

import { z } from "zod";

import { tagTypeSchema } from "@/components/tag/tag-input";

import { projectFlags } from "@/config/config/flags";

// eslint-disable-next-line no-control-regex
const ascii_pattern = /^[\x00-\x7F]+$/;

function isAscii(str: string) {
  return ascii_pattern.test(str);
}

function findNonAscii(text: string) {
  const nonAsciiSet = new Set(
    text.split("").filter((char) => char.charCodeAt(0) > 127),
  );
  return Array.from(nonAsciiSet);
}

const baseProjectFormSchema = z.object({
  title: z
    .string()
    .min(4, "Please enter a longer title")
    .max(512, "Title must be 512 characters or less"),
  description: z
    .string()
    .min(10, "Please enter a longer description")
    .max(2048, "Description must be 2048 characters or less")
    .refine(isAscii, (val) => ({
      message: `Please remove non-ASCII characters: ${findNonAscii(val).join(", ")}`,
    })),
  flagTitles: z
    .array(z.string())
    .refine((value) => value.some((item) => item), {
      message: "You have to select at least one flag for a project.",
    }),
  tags: z.array(z.object({ id: z.string(), title: z.string() })),
  isPreAllocated: z.boolean().optional(),
  capacityUpperBound: z.coerce.number().int().positive().default(1),
  preAllocatedStudentId: z.string().min(1).optional(),
  specialTechnicalRequirements: z.string().optional(),
});

export const updatedProjectSchema = baseProjectFormSchema.refine(
  ({ isPreAllocated, preAllocatedStudentId }) =>
    !(!!isPreAllocated && preAllocatedStudentId === ""),
  { message: "Please select a student", path: ["preAllocatedStudentId"] },
);

export type UpdatedProject = z.infer<typeof updatedProjectSchema>;

export function buildUpdatedProjectSchema(
  takenTitles: string[],
  requiredFlags: string[] = [],
) {
  return updatedProjectSchema
    .refine(({ title }) => !takenTitles.includes(title), {
      message: "This title is already taken",
      path: ["title"],
    })
    .refine(
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

export const currentProjectFormDetailsSchema = baseProjectFormSchema
  .omit({ capacityUpperBound: true, preAllocatedStudentId: true })
  .extend({
    id: z.string(),
    capacityUpperBound: z.number(),
    preAllocatedStudentId: z.string(),
  });

export type CurrentProjectFormDetails = z.infer<
  typeof currentProjectFormDetailsSchema
>;

const formInternalDataSchema = z.object({
  takenTitles: z.array(z.string()),
  flags: z.array(z.object({ id: z.string(), title: z.string() })),
  tags: z.array(tagTypeSchema),
  students: z.array(z.object({ id: z.string() })),
});

export type FormInternalData = z.infer<typeof formInternalDataSchema>;

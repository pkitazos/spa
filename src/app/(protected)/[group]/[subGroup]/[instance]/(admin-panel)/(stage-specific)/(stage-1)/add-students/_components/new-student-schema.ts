import { z } from "zod";

import { type FlagDTO } from "@/dto";

import { institutionIdSchema } from "@/lib/validations/institution-id";

export const baseNewStudentSchema = z.object({
  fullName: z
    .string("Please enter a valid name")
    .min(1, "Please enter a valid name"),
  institutionId: institutionIdSchema,
  email: z
    .email("Please enter a valid email address")
    .min(1, "Please enter a valid email address"),
  flagId: z
    .string("Please select a valid flag")
    .min(1, "Please select a valid flag"),
});

// for CSV parsing - validates the raw flag ID string
export const csvStudentSchema = baseNewStudentSchema;

// for form validation - validates flag ID exists in available flags
export function buildNewStudentSchema(flags: FlagDTO[]) {
  return baseNewStudentSchema.extend({
    flagId: z
      .string("Please select a valid flag")
      .refine((id) => flags.some((flag) => flag.id === id), {
        message: "Provided flag does not exist",
      }),
  });
}

export type NewStudent = z.infer<ReturnType<typeof buildNewStudentSchema>>;

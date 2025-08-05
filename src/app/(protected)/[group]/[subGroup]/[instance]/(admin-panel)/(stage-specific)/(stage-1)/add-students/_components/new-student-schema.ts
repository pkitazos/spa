import { z } from "zod";

import { INSTITUTION } from "@/config/institution";

import { type FlagDTO } from "@/dto";

// MOVE - maybe co-locate these with the CSV parsing logic, it's the only place they are used

export const baseNewStudentSchema = z.object({
  fullName: z
    .string("Please enter a valid name")
    .min(1, "Please enter a valid name"),
  institutionId: z.coerce
    .string<string>(`Please enter a valid ${INSTITUTION.ID_NAME}`)
    .min(1, `Please enter a valid ${INSTITUTION.ID_NAME}`),
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

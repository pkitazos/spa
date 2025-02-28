import { z } from "zod";

import { studentLevelSchema } from "@/lib/validations/student-level";

import { flagDtoSchema } from "..";

import { instanceUserDtoSchema } from ".";

export const studentDtoSchema = instanceUserDtoSchema.extend({
  level: studentLevelSchema,
  latestSubmission: z.date().optional(),
  flags: z.array(flagDtoSchema),
});

export type StudentDTO = z.infer<typeof studentDtoSchema>;

// student preferences

import { z } from "zod";

import { flagDtoSchema } from "..";

import { instanceUserDtoSchema } from ".";

export const studentDtoSchema = instanceUserDtoSchema.extend({
  level: z.number(),
  latestSubmission: z.date().optional(),
  flags: z.array(flagDtoSchema),
});

export type StudentDTO = z.infer<typeof studentDtoSchema>;

// student preferences

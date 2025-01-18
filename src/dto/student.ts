import { z } from "zod";

import { userDtoSchema } from ".";

export const studentDtoSchema = userDtoSchema.extend({
  level: z.number(),
});

export type StudentDTO = z.infer<typeof studentDtoSchema>;

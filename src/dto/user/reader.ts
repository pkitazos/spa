import { z } from "zod";

import { instanceUserDtoSchema } from ".";

export const readerDtoSchema = instanceUserDtoSchema.extend({
  allocationTarget: z.number(),
  allocationLowerBound: z.number(),
  allocationUpperBound: z.number(),
});

export type ReaderDTO = z.infer<typeof readerDtoSchema>;

// reader preferences

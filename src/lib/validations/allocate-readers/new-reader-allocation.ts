import { z } from "zod";

import { userDtoSchema } from "@/dto";

// todo: standardise types

export const newReaderAllocationSchema = z.object({
  studentId: z.string(),
  reader: userDtoSchema,
});

export type NewReaderAllocation = z.infer<typeof newReaderAllocationSchema>;

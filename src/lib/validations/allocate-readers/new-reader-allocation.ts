import { userDtoSchema } from "@/dto";
import { z } from "zod";

export const newReaderAllocationSchema = z.object({
  studentId: z.string(),
  reader: userDtoSchema,
});

export type NewReaderAllocation = z.infer<typeof newReaderAllocationSchema>;

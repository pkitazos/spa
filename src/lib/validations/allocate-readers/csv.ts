import { z } from "zod";

// move - co-locate with form-section
export const allocateReadersCsvRowSchema = z.object({
  student_guid: z.string({ error: "a valid GUID" }),
  reader_guid: z.string({ error: "a valid GUID" }),
  reader_name: z.string({ error: "a valid Full Name" }),
  reader_email: z.email({ error: "a valid Email" }),
});

export const allocateReadersCsvHeaders = Object.keys(
  allocateReadersCsvRowSchema.shape,
) as (keyof typeof allocateReadersCsvRowSchema.shape)[];

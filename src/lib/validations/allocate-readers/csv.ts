import { z } from "zod";

export const allocateReadersCsvHeaders = [
  "student_guid",
  "reader_guid",
  "reader_name",
  "reader_email",
];

export const allocateReadersCsvRowSchema = z.object({
  student_guid: z.string({ error: "a valid GUID" }),
  reader_guid: z.string({ error: "a valid GUID" }),
  reader_name: z.string({ error: "a valid Full Name" }),
  reader_email: z.email({ error: "a valid Email" }),
});

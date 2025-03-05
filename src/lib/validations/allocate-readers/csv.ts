import { z } from "zod";

export const allocateReadersCsvHeaders = [
  "student_guid",
  "reader_guid",
  "reader_name",
  "reader_email",
];

export const allocateReadersCsvRowSchema = z.object({
  student_guid: z.string({
    required_error: "a valid GUID",
    invalid_type_error: "a valid GUID",
  }),
  reader_guid: z.string({
    required_error: "a valid GUID",
    invalid_type_error: "a valid GUID",
  }),
  reader_name: z.string({
    required_error: "a valid Full Name",
    invalid_type_error: "a valid Full Name",
  }),
  reader_email: z
    .string({
      required_error: "a valid Email",
      invalid_type_error: "a valid Email",
    })
    .email(),
});

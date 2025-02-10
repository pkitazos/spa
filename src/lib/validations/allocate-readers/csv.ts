import { z } from "zod";

export const allocateReadersCsvHeaders = [
  "project_title",
  "student_guid",
  "supervisor_guid",
  "reader_name",
];

export const allocateReadersCsvRowSchema = z.object({
    project_title: z.string({
      required_error: "a valid Project Title",
      invalid_type_error: "a valid Project Title",
    }),
    student_guid: z.string({
      required_error: "a valid GUID",
      invalid_type_error: "a valid GUID",
    }),
    supervisor_guid: z.string({
        required_error: "a valid GUID",
        invalid_type_error: "a valid GUID",
      }),
    reader_name: z.string({
        required_error: "a valid Full Name",
        invalid_type_error: "a valid Full Name",
      }),
  });
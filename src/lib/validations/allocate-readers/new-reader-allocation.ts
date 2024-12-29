import { z } from "zod";

export const newReaderAllocationSchema = z.object({
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

export type NewReaderAllocation = z.infer<typeof newReaderAllocationSchema>;
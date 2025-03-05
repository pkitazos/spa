import { z } from "zod";

const markingFormSchema = z.object({
  marks: z.array(z.tuple([z.string(), z.number(), z.string()])), // (flagId, mark, justification)
  finalComments: z.string(),
  prize: z.boolean(),
  markerId: z.string(),
  studentId: z.string(),
});

export type markingFormZ = z.infer<typeof markingFormSchema>;

export const currentMarksSchema = markingFormSchema.extend({ id: z.string() });

export type CurrentMarks = z.infer<typeof currentMarksSchema>;

export type UpdatedMarks = z.infer<typeof markingFormSchema>;

import { z } from "zod";

const markingFormSchema = z.object({
  marks: z.array(z.number()),
});

export type markingFormZ = z.infer<typeof markingFormSchema>;

export const currentMarksSchema = markingFormSchema
  .extend({
    id: z.string(),
  });

export type CurrentMarks = z.infer<
  typeof currentMarksSchema
>;

export type UpdatedMarks = z.infer<typeof markingFormSchema>;

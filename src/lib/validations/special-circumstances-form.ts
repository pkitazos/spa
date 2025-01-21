import { z } from "zod";

const specialCircumstancesFormSchema = z.object({
  specialCircumstances: z.string().optional(),
});

export type specialCircumstances = z.infer<typeof specialCircumstancesFormSchema>;

export const currentSpecialCircumstancesSchema = specialCircumstancesFormSchema
  .extend({
    id: z.string(),
  });

export type CurrentSpecialCircumstances = z.infer<
  typeof currentSpecialCircumstancesSchema
>;

export type UpdatedSpecialCircumstances = z.infer<typeof specialCircumstancesFormSchema>;

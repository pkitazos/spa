import { z } from "zod";

export const flagDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
});

export type FlagDTO = z.infer<typeof flagDtoSchema>;

export const tagDtoSchema = z.object({ id: z.string(), title: z.string() });

export type TagDTO = z.infer<typeof tagDtoSchema>;

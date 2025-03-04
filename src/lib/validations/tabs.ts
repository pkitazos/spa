import { z } from "zod";

export const tabTypeSchema = z.object({
  title: z.string(),
  href: z.string(),
  icon: z.string().optional(),
});

export const tabGroupSchema = z.object({
  title: z.string(),
  tabs: z.array(tabTypeSchema),
});

export type TabType = z.infer<typeof tabTypeSchema>;

export type TabGroup = z.infer<typeof tabGroupSchema>;

import { z } from "zod";

export const groupParamsSchema = z.object({
  group: z.string(),
});

export const subGroupParamsSchema = z.object({
  group: z.string(),
  subGroup: z.string(),
});

export const instanceParamsSchema = z.object({
  group: z.string(),
  subGroup: z.string(),
  instance: z.string(),
});

export const projectParamsSchema = z.object({
  group: z.string(),
  subGroup: z.string(),
  instance: z.string(),
  projectId: z.string(),
});

export const spaceParamsSchema = groupParamsSchema
  .or(subGroupParamsSchema)
  .or(instanceParamsSchema);

export type GroupParams = z.infer<typeof groupParamsSchema>;

export type SubGroupParams = z.infer<typeof subGroupParamsSchema>;

export type InstanceParams = z.infer<typeof instanceParamsSchema>;

export type ProjectParams = z.infer<typeof projectParamsSchema>;

export type SpaceParams = z.infer<typeof spaceParamsSchema>;

export const refinedSpaceParamsSchema = z.object({
  group: z.string(),
  subGroup: z.string().optional(),
  instance: z.string().optional(),
});

export type RefinedSpaceParams = z.infer<typeof refinedSpaceParamsSchema>;

export type PageParams = InstanceParams & { id: string };

export type SearchParams = { [key: string]: string | string[] | undefined };

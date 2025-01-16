import { z } from "zod";

export const userDtoSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
});

export type UserDTO = z.infer<typeof userDtoSchema>;

export const userInInstanceDtoSchema = z.object({
  userId: z.string(),
  joined: z.boolean(),
  group: z.string(),
  subGroup: z.string(),
  instance: z.string(),
});

export type UserInInstanceDTO = z.infer<typeof userInInstanceDtoSchema>;

// Spaces

export const groupDtoSchema = z.object({
  group: z.string(),
  displayName: z.string(),
});

export type GroupDTO = z.infer<typeof groupDtoSchema>;

export const subGroupDtoSchema = z.object({
  group: z.string(),
  subGroup: z.string(),
  displayName: z.string(),
});

export type SubGroupDTO = z.infer<typeof subGroupDtoSchema>;

export const instanceDtoSchema = z.object({
  group: z.string(),
  subGroup: z.string(),
  instance: z.string(),
  displayName: z.string(),
});

export type InstanceDTO = z.infer<typeof instanceDtoSchema>;

export const flagDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
});

export const tagDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
});

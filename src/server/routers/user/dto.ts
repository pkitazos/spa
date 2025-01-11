import { z } from "zod";

export const userDtoSchema = z.object({
  email: z.string(),
  id: z.string(),
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

export const instanceEQ = (a: InstanceDTO, b: InstanceDTO) =>
  a.group === b.group && a.subGroup === b.subGroup && a.instance === b.instance;

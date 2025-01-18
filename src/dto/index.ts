import { z } from "zod";

import { stageSchema } from "@/lib/validations/stage";

export const userDtoSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
});

export type UserDTO = z.infer<typeof userDtoSchema>;

export const userInInstanceDtoSchema = z.object({
  userId: z.string(),
  joined: z.boolean(),
  // I had a thought about these, but you might disagree
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
  stage: stageSchema,
  selectedAlgName: z.string().optional(),
  parentInstanceId: z.string().optional(),
  projectSubmissionDeadline: z.date(),
  supervisorAllocationAccess: z.boolean(),
  minStudentPreferences: z.number(),
  maxStudentPreferences: z.number(),
  maxStudentPreferencesPerSupervisor: z.number(),
  studentPreferenceSubmissionDeadline: z.date(),
  studentAllocationAccess: z.boolean(),
  minReaderPreferences: z.number(),
  maxReaderPreferences: z.number(),
  readerPreferenceSubmissionDeadline: z.date(),
});

export type InstanceDTO = z.infer<typeof instanceDtoSchema>;

export const flagDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
});

export type FlagDTO = z.infer<typeof flagDtoSchema>;

export const tagDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
});

export type TagDTO = z.infer<typeof tagDtoSchema>;

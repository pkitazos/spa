import { stageSchema } from "@/db/types";
import { z } from "zod";

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
  selectedAlgConfigId: z.string().optional(),
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

// TODO consider inlining this one...
export const instanceDisplayDataSchema = z.object({
  group: z.object({ id: z.string(), displayName: z.string() }),
  subGroup: z.object({ id: z.string(), displayName: z.string() }),
  instance: z.object({ id: z.string(), displayName: z.string() }),
});

export type InstanceDisplayData = z.infer<typeof instanceDisplayDataSchema>;

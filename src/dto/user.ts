import { z } from "zod";
import { flagDtoSchema } from "./flag-tag";

export const userDtoSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
});

export type UserDTO = z.infer<typeof userDtoSchema>;

export const instanceUserDtoSchema = userDtoSchema.extend({
  joined: z.boolean(),
});

export type InstanceUserDTO = z.infer<typeof instanceUserDtoSchema>;

export const superAdminDtoSchema = userDtoSchema;

export type SuperAdminDTO = z.infer<typeof superAdminDtoSchema>;

export const groupAdminDtoSchema = userDtoSchema.extend({ group: z.string() });

export type GroupAdminDTO = z.infer<typeof groupAdminDtoSchema>;

export const subGroupAdminDtoSchema = userDtoSchema.extend({
  group: z.string(),
  subGroup: z.string(),
});

export type SubGroupAdminDTO = z.infer<typeof subGroupAdminDtoSchema>;

export const readerDtoSchema = instanceUserDtoSchema.extend({
  allocationTarget: z.number(),
  allocationLowerBound: z.number(),
  allocationUpperBound: z.number(),
});

export type ReaderDTO = z.infer<typeof readerDtoSchema>;

export const studentDtoSchema = instanceUserDtoSchema.extend({
  level: z.number(),
  latestSubmission: z.date().optional(),
  flags: z.array(flagDtoSchema),
});

export type StudentDTO = z.infer<typeof studentDtoSchema>;

export const supervisorDtoSchema = instanceUserDtoSchema.extend({
  allocationTarget: z.number(),
  allocationLowerBound: z.number(),
  allocationUpperBound: z.number(),
});

export type SupervisorDTO = z.infer<typeof supervisorDtoSchema>;

// unsure if we will use these - but here for completeness

import { z } from "zod";

import { userDtoSchema } from ".";

export const superAdminDtoSchema = userDtoSchema;

export type SuperAdminDTO = z.infer<typeof superAdminDtoSchema>;

export const groupAdminDtoSchema = userDtoSchema.extend({ group: z.string() });

export type GroupAdminDTO = z.infer<typeof groupAdminDtoSchema>;

export const subGroupAdminDtoSchema = userDtoSchema.extend({
  group: z.string(),
  subGroup: z.string(),
});

export type SubGroupAdminDTO = z.infer<typeof subGroupAdminDtoSchema>;

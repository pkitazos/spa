import { z } from "zod";

import { studentDtoSchema } from "./student";

export const supervisorDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  projectTarget: z.number(),
  projectUpperQuota: z.number(),
});

export type SupervisorDTO = z.infer<typeof supervisorDtoSchema>;

// TODO: revisit this whole file tbh
export const baseProjectDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  supervisorId: z.string(),
  preAllocatedStudentId: z.string().optional(),
});

export type BaseProjectDto = z.infer<typeof baseProjectDtoSchema>;

export const supervisionAllocationDtoSchema = z.object({
  project: baseProjectDtoSchema,
  student: studentDtoSchema,
  rank: z.number(),
});

export type SupervisionAllocationDto = z.infer<
  typeof supervisionAllocationDtoSchema
>;

export const supervisorCapacityDetailsSchema = supervisorDtoSchema.omit({
  id: true,
  name: true,
  email: true,
});

export type SupervisorCapacityDetails = z.infer<
  typeof supervisorCapacityDetailsSchema
>;

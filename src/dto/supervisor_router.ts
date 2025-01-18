import { z } from "zod";

import { studentDtoSchema } from "./student";
import { flagDtoSchema, tagDtoSchema, userDtoSchema } from ".";

export const supervisorDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  projectTarget: z.number(),
  projectUpperQuota: z.number(),
});

export type SupervisorDTO = z.infer<typeof supervisorDtoSchema>;

export const baseProjectDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  supervisorId: z.string(),
  preAllocatedStudentId: z.string().optional(),
});

export type BaseProjectDto = z.infer<typeof baseProjectDtoSchema>;

export const project__AllocatedStudents_Schema = baseProjectDtoSchema.extend({
  allocatedStudents: z.array(userDtoSchema),
});

export type Project__AllocatedStudents = z.infer<
  typeof project__AllocatedStudents_Schema
>;

export const project__Capacities_Schema = baseProjectDtoSchema.extend({
  capacityLowerBound: z.number(),
  capacityUpperBound: z.number(),
});

export type Project__Capacities = z.infer<typeof project__Capacities_Schema>;

export const project__AllocatedStudents_Capacities_Schema =
  baseProjectDtoSchema.extend({
    capacityLowerBound: z.number(),
    capacityUpperBound: z.number(),
    allocatedStudents: z.array(userDtoSchema),
  });

export type Project__AllocatedStudents_Capacities = z.infer<
  typeof project__AllocatedStudents_Capacities_Schema
>;

export const project__AllocatedStudents_Flags_Tags_Schema =
  baseProjectDtoSchema.extend({
    tags: z.array(tagDtoSchema),
    flags: z.array(flagDtoSchema),
    allocatedStudents: z.array(userDtoSchema),
  });

export type Project__AllocatedStudents_Flags_Tags = z.infer<
  typeof project__AllocatedStudents_Flags_Tags_Schema
>;

export const supervisionAllocationDtoSchema = z.object({
  project: baseProjectDtoSchema,
  student: studentDtoSchema.extend({ rank: z.number() }),
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

import { z } from "zod";

import { instanceUserDtoSchema } from ".";

export const supervisorDtoSchema = instanceUserDtoSchema.extend({
  allocationTarget: z.number(),
  allocationLowerBound: z.number(),
  allocationUpperBound: z.number(),
});

export type SupervisorDTO = z.infer<typeof supervisorDtoSchema>;

export const supervisorWithProjectsDtoSchema = supervisorDtoSchema.extend({
  projects: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      allocatedTo: z.array(z.string()),
    }),
  ),
});

export type SupervisorWithProjectsDTO = z.infer<
  typeof supervisorWithProjectsDtoSchema
>;

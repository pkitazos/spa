import { z } from "zod";

import { userDtoSchema } from ".";

export const supervisorDtoSchema = userDtoSchema.extend({
  projectTarget: z.number(),
  projectUpperQuota: z.number(),
});

export type SupervisorDTO = z.infer<typeof supervisorDtoSchema>;

export const supervisorDetailsDtoSchema = z.object({
  supervisorId: z.string(),
  projectTarget: z.number(),
  projectUpperQuota: z.number(),
});

export type SupervisorDetailsDTO = z.infer<typeof supervisorDetailsDtoSchema>;

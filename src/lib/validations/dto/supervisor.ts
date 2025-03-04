import { z } from "zod";

/**
 * @deprecated
 */
export const supervisorDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  projectTarget: z.number(),
  projectUpperQuota: z.number(),
});

/**
 * @deprecated
 */
export type SupervisorDto = z.infer<typeof supervisorDtoSchema>;

/**
 * @deprecated
 */
export const supervisorInviteDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  joined: z.boolean(),
});

/**
 * @deprecated
 */
export type SupervisorInviteDto = z.infer<typeof supervisorInviteDtoSchema>;

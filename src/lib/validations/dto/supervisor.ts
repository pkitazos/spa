import { z } from "zod";

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
 * @deprecated use instanceUser from @/dto
 */
export type SupervisorInviteDto = z.infer<typeof supervisorInviteDtoSchema>;

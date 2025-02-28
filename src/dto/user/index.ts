import { z } from "zod";

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

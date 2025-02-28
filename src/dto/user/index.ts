import { z } from "zod";

export const userDtoSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
});

export type UserDTO = z.infer<typeof userDtoSchema>;

export const instanceUserDtoSchema = userDtoSchema.extend({
  joined: z.boolean(),
  // I had a thought about these, but you might disagree
  group: z.string(),
  subGroup: z.string(),
  instance: z.string(),
});

export type InstanceUserDTO = z.infer<typeof instanceUserDtoSchema>;

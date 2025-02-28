import { z } from "zod";

import { subsequentStages } from "@/lib/utils/permissions/stage-check";

import { Stage } from "@/db/types";

export {
  type GroupDTO,
  groupDtoSchema,
  type InstanceDTO,
  instanceDtoSchema,
  type SubGroupDTO,
  subGroupDtoSchema,
} from "./space";
export {
  type InstanceUserDTO,
  instanceUserDtoSchema,
  type UserDTO,
  userDtoSchema,
} from "./user";
export { type SupervisorDTO } from "./user/supervisor";

export const flagDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
});

export type FlagDTO = z.infer<typeof flagDtoSchema>;

export const tagDtoSchema = z.object({ id: z.string(), title: z.string() });

export type TagDTO = z.infer<typeof tagDtoSchema>;

// TODO is this really a DTO?
export const instanceDisplayDataSchema = z.object({
  group: z.object({ id: z.string(), displayName: z.string() }),
  subGroup: z.object({ id: z.string(), displayName: z.string() }),
  instance: z.object({ id: z.string(), displayName: z.string() }),
});

export type InstanceDisplayData = z.infer<typeof instanceDisplayDataSchema>;

// MOVE all this stuff below is in the wrong place
export const supervisorStages: Stage[] = [Stage.SETUP];

export const studentStages: Stage[] = [Stage.SETUP, Stage.PROJECT_SUBMISSION];

export const readerStages: Stage[] = subsequentStages(
  Stage.ALLOCATION_PUBLICATION,
);

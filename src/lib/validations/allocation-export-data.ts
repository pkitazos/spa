import { z } from "zod";

// TODO: update validation schemas according to the agreed API response

export const studentCheckResponseSchema = z.array(
  z.object({ guid: z.string(), exists: z.literal(0).or(z.literal(1)) }),
);

export const supervisorCheckResponseSchema = z.array(
  z.object({ guid: z.string(), exists: z.number() }),
);

export const projectCreationResponseSchema = z.array(
  z.object({
    id: z.string(),
    created_successfully: z.literal(0).or(z.literal(1)),
  }),
);

import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string(),
    SERVER_URL: z.string(),

    DEV_ENV: z.string().optional(),

    DEV_ID: z.string().optional(),
    DEV_NAME: z.string().optional(),
    DEV_EMAIL: z.string().optional(),
  },
  runtimeEnv: process.env,
});

import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  skipValidation: !process.env.VALIDATE_ENV_VARS,
  server: {
    DATABASE_URL: z.string(),
    MATCHING_SERVER_URL: z.string(),
    FRONTEND_SERVER_URL: z.string(),

    DEV_ENV: z.string().optional(),

    DEV_ID: z.string().optional(),
    DEV_NAME: z.string().optional(),
    DEV_EMAIL: z.string().optional(),

    MAIL_HOST: z.string(),
    MAIL_PORT: z.coerce.number(),
    MAIL_USER: z.string(),
    MAIL_PASSWORD: z.string().optional(),

    WHITELISTED_USERS: z.string().optional(),
  },
  runtimeEnv: process.env,
});

import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const switchSchema = z.enum(["ON", "OFF"]);

export const env = createEnv({
  skipValidation: !process.env.VALIDATE_ENV_VARS,
  server: {
    /** URL for the postgres database */
    DATABASE_URL: z.string(),
    /** URL for the (backend) matching service */
    MATCHING_SERVER_URL: z.string(),
    /** URL for the frontend (this site) */
    FRONTEND_SERVER_URL: z.string(),

    /** SMTP server host */
    MAIL_HOST: z.string(),
    /** SMTP server port */
    MAIL_PORT: z.coerce.number(),
    /** SMTP user */
    MAIL_USER: z.email(),
    /** SMTP password (if applicable) */
    MAIL_PASSWORD: z.string().optional(),

    /** Fallback user ID for when AUTH_FROM_HEADERS is off (usually used for local testing) */
    DEV_ID: z.string().optional(),
    /** Fallback user name for when AUTH_FROM_HEADERS is off (usually used for local testing) */
    DEV_NAME: z.string().optional(),
    /** Fallback user email for when AUTH_FROM_HEADERS is off (usually used for local testing) */
    DEV_EMAIL: z.string().optional(),

    /** Extract authentication information from headers. */
    AUTH_FROM_HEADERS: switchSchema.default("OFF"),
    /** Enable whitelist - only specified users will be able to access the site */
    AUTH_WHITELIST_ENABLED: switchSchema.default("OFF"),
    /** comma-separated list of whitelisted user emails */
    AUTH_WHITELIST_EMAILS: z
      .string()
      .default("")
      .transform((x) => x.split(",")),

    /** Allow users to masquerade as other users.
     * Useful for testing, not to be used in prod. */
    AUTH_MASKING_ENABLED: switchSchema.default("OFF"),

    /** Comma-separated list of test user emails */
    AUTH_MASKING_EMAILS: z
      .string()
      .default("")
      .transform((x) =>
        x
          .split(",")
          .map((email) => email.trim())
          .filter((email) => email.length > 0)
          .map((email, index) => ({ email, ord: index })),
      ),

    /** Name of the header to extract Shibboleth GUID from */
    HEADERS_SHIB_GUID: z.string().optional(),
    /** Name of the header to extract Shibboleth display name from */
    HEADERS_SHIB_DISPLAY_NAME: z.string().optional(),
    /** Name of the header to extract Shibboleth email from */
    HEADERS_SHIB_EMAIL: z.string().optional(),
  },
  runtimeEnv: process.env,
});

import { env } from "@/env";
import { headers } from "next/headers";

import { userDtoSchema, type UserDTO } from "@/dto";

import { retrieveUser } from "./procedures";
import { getCurrentDevUser } from "./switcher-actions";

/**
 * Get the authentication state of the app.
 * Should be a server-side call
 * @returns `real` - User extracted from headers / env variables
 *
 * `mask` - When masking is on, the current mask. Otherwise just a copy of real
 */
export async function auth(): Promise<{ real: UserDTO; mask: UserDTO }> {
  const real = await getRealUser();
  const mask = await getMaskUser();
  return { real, mask };
}

/**
 * Extract the 'real' user from headers or env fallback
 * */
async function getRealUser(): Promise<UserDTO> {
  let id;
  let name;
  let email;

  if (env.AUTH_FROM_HEADERS === "ON") {
    if (
      !env.HEADERS_SHIB_GUID ||
      !env.HEADERS_SHIB_DISPLAY_NAME ||
      !env.HEADERS_SHIB_EMAIL
    ) {
      throw new Error(
        "Must specify Shibboleth header names to use header authentication",
      );
    }

    id = headers().get(env.HEADERS_SHIB_GUID);
    name = headers().get(env.HEADERS_SHIB_DISPLAY_NAME);
    email = headers().get(env.HEADERS_SHIB_EMAIL);
  } else {
    id = env.DEV_ID;
    name = env.DEV_NAME;
    email = env.DEV_EMAIL;
  }

  const user = await retrieveUser(userDtoSchema.parse({ id, name, email }));
  return user;
}

/**
 * If masking is off, this is just ID on real user
 * @returns The current auth mask
 *  */
async function getMaskUser() {
  if (env.AUTH_MASKING_ENABLED === "OFF") return await getRealUser();
  return (await getCurrentDevUser()) ?? (await getRealUser());
}

/**
 * Check if a user is on the whitelist
 * @param user User to check
 * @returns whether the user is whitelisted or not
 */
export function whitelisted(user: UserDTO): boolean {
  return env.AUTH_WHITELIST_EMAILS.includes(user.email);
}

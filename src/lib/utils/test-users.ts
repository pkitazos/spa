import { env } from "@/env";

/**
 * Gets test user emails from environment variable with their order indices
 * @returns Array of objects with email and ord properties, or empty array if not configured
 */
export function getTestUsers(): { email: string; ord: number }[] {
  return env.TEST_USER_EMAILS.map((email) => email.trim())
    .filter((email) => email.length > 0)
    .map((email, index) => ({ email, ord: index }));
}

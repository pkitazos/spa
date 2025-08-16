"use server";

import { env } from "@/env";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { type UserDTO } from "@/dto";

import { User } from "@/data-objects";

import { db } from "@/db";

const DEV_USER_COOKIE_KEY = "dev-selected-user-id";

export async function switchDevUser(userId: string): Promise<void> {
  if (env.AUTH_MASKING_ENABLED === "OFF") {
    throw new Error("User switching is only available in development");
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("User not found");
  }

  const cookieStore = cookies();
  cookieStore.set(DEV_USER_COOKIE_KEY, userId, {
    maxAge: 60 * 60 * 24 * 7, // 1 week
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });

  // redirect to refresh the page and trigger re-authentication
  redirect("/");
}

/**
 * Get the current authentication mask, if enabled
 * @returns Current mask (if one exists)
 */
export async function getCurrentDevUser(): Promise<UserDTO | undefined> {
  if (env.AUTH_MASKING_ENABLED === "OFF") {
    return undefined;
  }

  const cookieStore = cookies();
  const devUserId = cookieStore.get(DEV_USER_COOKIE_KEY)?.value;

  if (!devUserId) {
    return undefined;
  }

  const user = await new User(db, devUserId).toMaybeDTO();
  return user;
}

/**
 * Log out the dev user
 * */
export async function clearDevUser() {
  if (env.AUTH_MASKING_ENABLED === "OFF") {
    throw new Error("User switching is only available in development");
  }

  const cookieStore = cookies();
  cookieStore.delete(DEV_USER_COOKIE_KEY);

  redirect("/");
}

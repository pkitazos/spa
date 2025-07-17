import { env } from "@/env";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";

import { type ShibUser } from "@/lib/validations/auth";

import { getCurrentDevUser } from "./actions";

export async function getShibUserFromHeaders() {
  let shib_guid: string | null = null;
  let shib_displayName: string | null = null;
  let shib_email: string | null = null;

  if (env.DEV_ENV === "PROD") {
    shib_guid = headers().get("DH75HDYT76");
    shib_displayName = headers().get("DH75HDYT77");
    shib_email = headers().get("DH75HDYT80");
  } else {
    // in dev mode, check for user switcher cookie first
    const devUser = await getCurrentDevUser();

    if (devUser) {
      shib_guid = devUser.id;
      shib_displayName = devUser.name;
      shib_email = devUser.email;
    } else {
      // if no cookie set, use env vars as default
      shib_guid = env.DEV_ID!;
      shib_displayName = env.DEV_NAME!;
      shib_email = env.DEV_EMAIL!;
    }
  }

  const guid = z.string().parse(shib_guid);
  const displayName = z.string().parse(shib_displayName);
  const email = z.string().parse(shib_email);

  return { guid, displayName, email };
}

export async function retrieveUser(user: ShibUser) {
  const dbUser = await db.user.findFirst({ where: { id: user.guid } });
  if (dbUser) return dbUser;

  try {
    const newUser = await db.user.create({
      data: { id: user.guid, name: user.displayName, email: user.email },
    });
    return newUser;
  } catch (_err) {
    throw new Error("No valid invite found for this user");
  }
}

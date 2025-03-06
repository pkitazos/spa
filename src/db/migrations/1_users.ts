/* eslint-disable @typescript-eslint/no-unused-vars */
import { PrismaClient } from "@prisma/client";

import userData from "./data/User.json";

export async function users(db: PrismaClient) {
  await db.$transaction([
    db.user.createMany({ data: userData, skipDuplicates: true }),
  ]);
}

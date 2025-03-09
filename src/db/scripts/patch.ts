/* eslint-disable @typescript-eslint/no-unused-vars */
import { PrismaClient } from "@prisma/client";
import { marking_scheme } from "../migrations/12_marking_schema";

const db = new PrismaClient();

async function main() {
  const group = "socs";
  const subGroup = "lvl-4-and-lvl-5-honours";
  const instance = "2024-2025";

  const params = { group, subGroup, instance };

  console.log("PATCH COMPLETE");
  await marking_scheme(db, params);
}

main()
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

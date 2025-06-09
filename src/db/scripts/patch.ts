import { PrismaClient } from "@prisma/client";
const group = "socs";
const subGroup = "lvl-4-and-lvl-5-honours";
const instance = "2024-2025";

const params = { group, subGroup, instance };

const db = new PrismaClient();

async function main() {
  const fs = await import("fs/promises");
}

main()
  .catch(async (e: any) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

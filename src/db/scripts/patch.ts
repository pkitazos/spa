/* eslint-disable @typescript-eslint/no-unused-vars */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const group = "socs";
  const subGroup = "lvl-4-and-lvl-5-honours";
  const instance = "2024-2025";

  const params = { group, subGroup, instance };

  await db.$transaction(async (tx) => {
    // code goes here
        
    // find reader ids using their name

    // find project id using student id in project allocations table

    // create list of objects


  });
  console.log("PATCH COMPLETE");
}

main()
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

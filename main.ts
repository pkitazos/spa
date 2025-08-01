import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const flags = await db.flag.findMany({});
  console.log("Flags:", flags);
}

main()
  .catch((_) => {
    process.exit(1);
  })
  .finally(() => {
    void db.$disconnect();
  });

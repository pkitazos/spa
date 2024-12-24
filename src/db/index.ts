import { PrismaClient, Stage } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export const Role = {
  ADMIN: "ADMIN",
  SUPERVISOR: "SUPERVISOR",
  READER: "READER",
  STUDENT: "STUDENT",
} as const;
// export const adminLevelOrd = {
//   [AdminLevel.SUPER]: 3,
//   [AdminLevel.GROUP]: 2,
//   [AdminLevel.SUB_GROUP]: 1,
//   [AdminLevel.NONE]: 0,
// } as const;

export const stageOrd = {
  [Stage.SETUP]: 1,
  [Stage.PROJECT_SUBMISSION]: 2,
  [Stage.PROJECT_SELECTION]: 3,
  [Stage.PROJECT_ALLOCATION]: 4,
  [Stage.ALLOCATION_ADJUSTMENT]: 5,
  [Stage.ALLOCATION_PUBLICATION]: 6,
} as const;

export type PrismaTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

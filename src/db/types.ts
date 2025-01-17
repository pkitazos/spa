import { PrismaClient } from "@prisma/client";

export type PrismaTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export type DB = PrismaClient;
export type TX = PrismaTransactionClient;

export type { AllocationInstance as DB_AllocationInstance } from "@prisma/client";

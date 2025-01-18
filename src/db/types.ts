import { PrismaClient } from "@prisma/client";

export type PrismaTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export type DB = PrismaClient;
export type TX = PrismaTransactionClient;

export type {
  AllocationGroup as DB_AllocationGroup,
  AllocationInstance as DB_AllocationInstance,
  AllocationSubGroup as DB_AllocationSubGroup,
  Flag as DB_Flag,
  FlagOnProject as DB_FlagOnProject,
  ProjectDetails as DB_ProjectDetails,
  ProjectInInstance as DB_ProjectInInstance,
  StudentDetails as DB_StudentDetails,
  StudentProjectAllocation as DB_StudentProjectAllocation,
  SupervisorDetails as DB_SupervisorDetails,
  Tag as DB_Tag,
  TagOnProject as DB_TagOnProject,
  User as DB_User,
  UserInInstance as DB_UserInInstance,
} from "@prisma/client";

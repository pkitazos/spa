import { PrismaClient, Stage } from "@prisma/client";
import { z } from "zod";

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

export const Role = {
  ADMIN: "ADMIN",
  SUPERVISOR: "SUPERVISOR",
  READER: "READER",
  STUDENT: "STUDENT",
} as const;

export type SystemRole = (typeof Role)[keyof typeof Role];

export const stageOrd = {
  [Stage.SETUP]: 1,
  [Stage.PROJECT_SUBMISSION]: 2,
  [Stage.STUDENT_BIDDING]: 3,
  [Stage.PROJECT_ALLOCATION]: 4,
  [Stage.ALLOCATION_ADJUSTMENT]: 5,
  [Stage.ALLOCATION_PUBLICATION]: 6,
  [Stage.READER_BIDDING]: 7,
  [Stage.READER_ALLOCATION]: 8,
  [Stage.MARK_SUBMISSION]: 9,
  [Stage.GRADE_PUBLICATION]: 10,
} as const;

export const AdminLevel = {
  SUPER: "SUPER",
  GROUP: "GROUP",
  SUB_GROUP: "SUB_GROUP",
  NONE: "NONE",
} as const;

/**
 * @deprecated
 */
export type SystemAdminLevel = (typeof AdminLevel)[keyof typeof AdminLevel];

export const adminLevelOrd = {
  [AdminLevel.SUPER]: 3,
  [AdminLevel.GROUP]: 2,
  [AdminLevel.SUB_GROUP]: 1,
  [AdminLevel.NONE]: 0,
} as const;

export const stageSchema = z.enum([
  Stage.SETUP,
  Stage.PROJECT_SUBMISSION,
  Stage.STUDENT_BIDDING,
  Stage.PROJECT_ALLOCATION,
  Stage.ALLOCATION_ADJUSTMENT,
  Stage.ALLOCATION_PUBLICATION,
  Stage.READER_BIDDING,
  Stage.READER_ALLOCATION,
  Stage.MARK_SUBMISSION,
  Stage.GRADE_PUBLICATION,
]);

export const adminLevelSchema = z.enum([
  AdminLevel.SUPER,
  AdminLevel.GROUP,
  AdminLevel.SUB_GROUP,
  AdminLevel.NONE,
]);

export type AdminLevel = z.infer<typeof adminLevelSchema>;

export { PreferenceType, Stage } from "@prisma/client";

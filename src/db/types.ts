import { PreferenceType, type PrismaClient, Stage } from "@prisma/client";
import { z } from "zod";

type PrismaTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export type DB = PrismaClient;
export type TX = PrismaTransactionClient;

export type {
  Algorithm as DB_Algorithm,
  AllocationGroup as DB_AllocationGroup,
  AllocationInstance as DB_AllocationInstance,
  AllocationSubGroup as DB_AllocationSubGroup,
  AssessmentCriterion as DB_AssessmentCriterion,
  CriterionScore as DB_CriterionScore,
  FinalGrade as DB_FinalGrade,
  Flag as DB_Flag,
  FlagOnProject as DB_FlagOnProject,
  UnitOfAssessment as DB_UnitOfAssessment,
  GroupAdmin as DB_GroupAdmin,
  MarkingSubmission as DB_MarkingSubmission,
  MatchingPair as DB_MatchingPair,
  MatchingResult as DB_MatchingResult,
  Project as DB_Project,
  ReaderDetails as DB_ReaderDetails,
  ReaderDraftPreference as DB_ReaderDraftPreference,
  ReaderProjectAllocation as DB_ReaderProjectAllocation,
  ReaderSubmittedPreference as DB_ReaderSubmittedPreference,
  StudentDetails as DB_StudentDetails,
  StudentDraftPreference as DB_StudentDraftPreference,
  StudentProjectAllocation as DB_StudentProjectAllocation,
  StudentSubmittedPreference as DB_StudentSubmittedPreference,
  SubGroupAdmin as DB_SubGroupAdmin,
  SuperAdmin as DB_SuperAdmin,
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

export type Role = (typeof Role)[keyof typeof Role];

export const roleSchema = z.enum([
  Role.ADMIN,
  Role.SUPERVISOR,
  Role.READER,
  Role.STUDENT,
]);

const RoleDisplayName: Record<Role, string> = {
  [Role.ADMIN]: "Admin",
  [Role.SUPERVISOR]: "Supervisor",
  [Role.READER]: "Reader",
  [Role.STUDENT]: "Student",
};

export const getRoleDisplayName = (role: Role): string => RoleDisplayName[role];

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

export const markerTypeSchema = z.enum([Role.SUPERVISOR, Role.READER]);

export const preferenceTypeSchema = z.enum([
  PreferenceType.SHORTLIST,
  PreferenceType.PREFERENCE,
]);

export const extendedPreferenceTypeSchema = z.enum([
  PreferenceType.SHORTLIST,
  PreferenceType.PREFERENCE,
  "SUBMITTED",
]);

export type ExtendedPreferenceType = z.infer<
  typeof extendedPreferenceTypeSchema
>;

export {
  AlgorithmFlag,
  PreferenceType,
  Stage,
  MarkerType,
  AllocationMethod,
} from "@prisma/client";

export type New<T> = Omit<T, "id">;

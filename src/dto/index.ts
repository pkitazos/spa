import { z } from "zod";

import { subsequentStages } from "@/lib/utils/permissions/stage-check";

import { AlgorithmFlag, MarkerType, Stage, stageSchema } from "@/db/types";
import { matchingResultDtoSchema } from "@/lib/validations/matching";
import {
  GenerousAlgorithm,
  GreedyAlgorithm,
  GreedyGenAlgorithm,
  MinCostAlgorithm,
} from "@/config/algorithms";

export const userDtoSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
});

export type UserDTO = z.infer<typeof userDtoSchema>;

export const instanceUserDtoSchema = userDtoSchema.extend({
  joined: z.boolean(),
});

export type InstanceUserDTO = z.infer<typeof instanceUserDtoSchema>;

export const superAdminDtoSchema = userDtoSchema;

export type SuperAdminDTO = z.infer<typeof superAdminDtoSchema>;

export const groupAdminDtoSchema = userDtoSchema.extend({ group: z.string() });

export type GroupAdminDTO = z.infer<typeof groupAdminDtoSchema>;

export const subGroupAdminDtoSchema = userDtoSchema.extend({
  group: z.string(),
  subGroup: z.string(),
});

export type SubGroupAdminDTO = z.infer<typeof subGroupAdminDtoSchema>;

export const flagDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
});

export type FlagDTO = z.infer<typeof flagDtoSchema>;

export const tagDtoSchema = z.object({ id: z.string(), title: z.string() });

export type TagDTO = z.infer<typeof tagDtoSchema>;

// TODO is this really a DTO?
// no? but it's a response type that's kinda large and annoying to have to write out every time we need it
export const instanceDisplayDataSchema = z.object({
  group: z.object({ id: z.string(), displayName: z.string() }),
  subGroup: z.object({ id: z.string(), displayName: z.string() }),
  instance: z.object({ id: z.string(), displayName: z.string() }),
});

export type InstanceDisplayData = z.infer<typeof instanceDisplayDataSchema>;

// MOVE all this stuff below is in the wrong place
export const supervisorStages: Stage[] = [Stage.SETUP];

export const studentStages: Stage[] = [Stage.SETUP, Stage.PROJECT_SUBMISSION];

export const readerStages: Stage[] = subsequentStages(
  Stage.ALLOCATION_PUBLICATION,
);

export const readerDtoSchema = instanceUserDtoSchema.extend({
  allocationTarget: z.number(),
  allocationLowerBound: z.number(),
  allocationUpperBound: z.number(),
});

export type ReaderDTO = z.infer<typeof readerDtoSchema>;

export const studentDtoSchema = instanceUserDtoSchema.extend({
  level: z.number(),
  latestSubmission: z.date().optional(),
  flags: z.array(flagDtoSchema),
});

export type StudentDTO = z.infer<typeof studentDtoSchema>;

export const supervisorDtoSchema = instanceUserDtoSchema.extend({
  allocationTarget: z.number(),
  allocationLowerBound: z.number(),
  allocationUpperBound: z.number(),
});

export type SupervisorDTO = z.infer<typeof supervisorDtoSchema>;

export const supervisorWithProjectsDtoSchema = supervisorDtoSchema.extend({
  projects: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      allocatedTo: z.array(z.string()),
    }),
  ),
});

export type SupervisorWithProjectsDTO = z.infer<
  typeof supervisorWithProjectsDtoSchema
>;

export const algorithmFlagSchema = z.nativeEnum(AlgorithmFlag);

export const algorithmDtoSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  createdAt: z.date(),
  description: z.string().optional(),
  flag1: algorithmFlagSchema,
  flag2: algorithmFlagSchema.optional(),
  flag3: algorithmFlagSchema.optional(),
  targetModifier: z.number(),
  upperBoundModifier: z.number(),
  maxRank: z.number(),
});

export type AlgorithmDTO = z.infer<typeof algorithmDtoSchema>;

export const gradedSubmissionDtoSchema = z.object({
  id: z.string(),
  flagId: z.string(),
  title: z.string(),
  deadline: z.date(),
  weight: z.number(),
});

export type GradedSubmissionDTO = z.infer<typeof gradedSubmissionDtoSchema>;

export const assessmentComponentDtoSchema = z.object({
  flagId: z.string(),
  submissionId: z.string(),
  title: z.string(),
  description: z.string(),
  weight: z.number(),
  layoutIndex: z.number(),
  markerType: z.nativeEnum(MarkerType),
});

export type AssessmentComponentDTO = z.infer<
  typeof assessmentComponentDtoSchema
>;

export const submissionMarkerGradeDtoSchema = z.object({
  gradedSubmissionId: z.string(),
  markerId: z.string(),
  grade: z.string(),
});

export type SubmissionMarkerGradeDTO = z.infer<
  typeof submissionMarkerGradeDtoSchema
>;
export const projectDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  specialTechnicalRequirements: z.string().optional(),
  preAllocatedStudentId: z.string().optional(),
  latestEditDateTime: z.date(),
  capacityLowerBound: z.number(),
  capacityUpperBound: z.number(),
  supervisorId: z.string(),
  flags: z.array(flagDtoSchema),
  tags: z.array(tagDtoSchema),
});

export type ProjectDTO = z.infer<typeof projectDtoSchema>;

export const updateProjectSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  /** set null to erase  */
  specialTechnicalRequirements: z.string().nullable().optional(),
  /** set null to erase  */
  preAllocatedStudentId: z.string().nullable().optional(),
  capacityLowerBound: z.number().optional(),
  capacityUpperBound: z.number().optional(),
  supervisorId: z.string().optional(),
  flags: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

export type UpdateProjectDTO = z.infer<typeof updateProjectSchema>;
/**
 * @deprecated
 */

export const DEPR_projectDtoSchema = projectDtoSchema.extend({
  supervisorId: z.string(),
});
/**
 * @deprecated use ProjectDetailsDTO instead (and eventually rename it to ProjectDTO)
 */

export type DEPR_ProjectDTO = z.infer<typeof DEPR_projectDtoSchema>;

export const groupDtoSchema = z.object({
  group: z.string(),
  displayName: z.string(),
});

export type GroupDTO = z.infer<typeof groupDtoSchema>;

export const subGroupDtoSchema = z.object({
  group: z.string(),
  subGroup: z.string(),
  displayName: z.string(),
});

export type SubGroupDTO = z.infer<typeof subGroupDtoSchema>;

export const instanceDtoSchema = z.object({
  group: z.string(),
  subGroup: z.string(),
  instance: z.string(),

  displayName: z.string(),
  stage: stageSchema,
  selectedAlgConfigId: z.string().optional(),
  parentInstanceId: z.string().optional(),
  projectSubmissionDeadline: z.date(),
  supervisorAllocationAccess: z.boolean(),
  minStudentPreferences: z.number(),
  maxStudentPreferences: z.number(),
  maxStudentPreferencesPerSupervisor: z.number(),
  studentPreferenceSubmissionDeadline: z.date(),
  studentAllocationAccess: z.boolean(),
  minReaderPreferences: z.number(),
  maxReaderPreferences: z.number(),
  readerPreferenceSubmissionDeadline: z.date(),
});

export type InstanceDTO = z.infer<typeof instanceDtoSchema>;

// ----

// TODO: centralise built-in algorithm names

export const allAlgorithmFlags = [
  { label: "GRE", value: AlgorithmFlag.GRE },
  { label: "GEN", value: AlgorithmFlag.GEN },
  { label: "LSB", value: AlgorithmFlag.LSB },
  { label: "MAXSIZE", value: AlgorithmFlag.MAXSIZE },
  { label: "MINCOST", value: AlgorithmFlag.MINCOST },
  { label: "MINSQCOST", value: AlgorithmFlag.MINSQCOST },
] as const;

// TODO: derive this from existing algorithmSchema
export function buildNewAlgorithmSchema(takenNames: Set<string>) {
  // TODO: fix closure issue. takenNames are not updated when algorithms are deleted
  const allTakenNames = new Set([
    "Generous",
    "Greedy",
    "MinCost",
    "Greedy-Generous",
    ...takenNames,
  ]);

  return z.object({
    displayName: z
      .string({ required_error: "Please select an Algorithm Name" })
      .refine((item) => !allTakenNames.has(item), "This name is already taken"),
    flag1: algorithmFlagSchema,
    flag2: algorithmFlagSchema.optional(),
    flag3: algorithmFlagSchema.optional(),
    targetModifier: z.coerce.number().int().nonnegative(),
    upperBoundModifier: z.coerce.number().int().nonnegative(),
    maxRank: z.coerce.number().int().positive().or(z.literal(-1)),
  });
}

// BREAKING
export const algorithmResultDtoSchema = z.object({
  algorithm: algorithmDtoSchema,
  matchingResults: matchingResultDtoSchema,
});

export type AlgorithmResultDTO = z.infer<typeof algorithmResultDtoSchema>;

export const builtInAlgorithms: AlgorithmDTO[] = [
  GenerousAlgorithm,
  GreedyAlgorithm,
  MinCostAlgorithm,
  GreedyGenAlgorithm,
];

export const builtInAlgSchema = z.enum([
  GenerousAlgorithm.id,
  GreedyAlgorithm.id,
  MinCostAlgorithm.id,
  GreedyGenAlgorithm.id,
]);

export type BuiltInAlg = z.infer<typeof builtInAlgSchema>;

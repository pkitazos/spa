import { z } from "zod";

// ---------------------------------------------------------------------------
// this is what the data looks like before we send it to the matching service

const studentMatchingDataSchema = z.object({
  id: z.string(),
  preferences: z.array(z.string()),
});

const projectMatchingDataSchema = z.object({
  id: z.string(),
  lowerBound: z.number(),
  upperBound: z.number(),
  supervisorId: z.string(),
});

const supervisorMatchingDataSchema = z.object({
  id: z.string(),
  lowerBound: z.number(),
  target: z.number(),
  upperBound: z.number(),
});

export const matchingDataDtoSchema = z.object({
  students: z.array(studentMatchingDataSchema),
  projects: z.array(projectMatchingDataSchema),
  supervisors: z.array(supervisorMatchingDataSchema),
  args: z.array(z.string()).optional(),
});

export type MatchingDataDTO = z.infer<typeof matchingDataDtoSchema>;

// ---------------------------------------------------------------------------
// matching service response

const matchingServiceMatchSchema = z.object({
  student_id: z.string(),
  project_id: z.string(),
  project_capacities: z.object({
    lower_bound: z.number().int(),
    upper_bound: z.number().int(),
  }),
  preference_rank: z.number().int(),
  supervisor_id: z.string(),
  supervisor_capacities: z.object({
    lower_bound: z.number().int(),
    target: z.number().int(),
    upper_bound: z.number().int(),
  }),
});

const matchingServiceResponseDataSchema = z.object({
  profile: z.array(z.number()),
  degree: z.number(),
  size: z.number(),
  weight: z.number(),
  cost: z.number(),
  costSq: z.number(),
  maxLecAbsDiff: z.number(),
  sumLecAbsDiff: z.number(),
  ranks: z.array(z.number()),
  matching: z.array(matchingServiceMatchSchema),
});

export const matchingServiceResponseSchema = z.object({
  status: z.number(),
  message: z.string(),
  data: matchingServiceResponseDataSchema.optional(),
});

// ---------------------------------------------------------------------------

const matchingPairSchema = z.object({
  userId: z.string(),
  projectId: z.string(),
  studentRanking: z.number(),
});

export const matchingResultDtoSchema = z.object({
  profile: z.array(z.number()),
  degree: z.number(),
  size: z.number(),
  weight: z.number(),
  cost: z.number(),
  costSq: z.number(),
  maxLecAbsDiff: z.number(),
  sumLecAbsDiff: z.number(),
  matching: z.array(matchingPairSchema),
  ranks: z.array(z.number()),
});

export type MatchingResultDTO = z.infer<typeof matchingResultDtoSchema>;

export const blankResult: MatchingResultDTO = {
  profile: [],
  degree: NaN,
  size: NaN,
  weight: NaN,
  cost: NaN,
  costSq: NaN,
  maxLecAbsDiff: NaN,
  sumLecAbsDiff: NaN,
  matching: [],
  ranks: [],
};

export type MatchingDetailsDto = {
  studentId: string;
  studentName: string;
  projectId: string;
  projectTitle: string;
  studentRank: number;
};

// ---------------------------------------------------------------------------

export const supervisorMatchingDetailsDtoSchema = z.object({
  projectTarget: z.number(),
  actualTarget: z.number(),
  projectUpperQuota: z.number(),
  actualUpperQuota: z.number(),
  allocationCount: z.number(),
  preAllocatedCount: z.number(),
  algorithmTargetDifference: z.number(),
  actualTargetDifference: z.number(),
});

export type SupervisorMatchingDetailsDto = z.infer<
  typeof supervisorMatchingDetailsDtoSchema
>;

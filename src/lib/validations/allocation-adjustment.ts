import { z } from "zod";

/**
 * @deprecated use ProjectDetails instead
 */
export type ProjectDetails_OLD = {
  capacityLowerBound: number;
  capacityUpperBound: number;
  allocatedTo: string[];
  supervisor: {
    supervisorInstanceDetails: {
      projectAllocationLowerBound: number;
      projectAllocationTarget: number;
      projectAllocationUpperBound: number;
    }[];
  };
};

export const projectDetailsSchema = z.object({
  capacityLowerBound: z.number(),
  capacityUpperBound: z.number(),
  allocatedTo: z.array(z.string()),
  supervisor: z.object({
    projectAllocationLowerBound: z.number(),
    projectAllocationTarget: z.number(),
    projectAllocationUpperBound: z.number(),
  }),
});

export type ProjectDetails = z.infer<typeof projectDetailsSchema>;

export type MatchingInfo = {
  profile: number[];
  weight: number;
  isValid: boolean;
  rowValidities: boolean[];
};

export const studentRowSchema = z.object({
  student: z.object({ id: z.string(), name: z.string() }),
  projects: z.array(z.object({ id: z.string(), selected: z.boolean() })),
});

export type StudentRow = z.infer<typeof studentRowSchema>;

export const projectInfoSchema = z.object({
  id: z.string(),
  title: z.string(),
  capacityLowerBound: z.number(),
  capacityUpperBound: z.number(),
  allocatedTo: z.array(z.string()),
  projectAllocationLowerBound: z.number(),
  projectAllocationTarget: z.number(),
  projectAllocationUpperBound: z.number(),
});

export type ProjectInfo = z.infer<typeof projectInfoSchema>;

export type RowProject = { id: string; selected: boolean };

export const supervisorDetailsSchema = z.object({
  supervisorId: z.string(),
  lowerBound: z.number(),
  target: z.number(),
  upperBound: z.number(),
  projects: z.array(z.string()),
});

export type SupervisorDetails = z.infer<typeof supervisorDetailsSchema>;

import { z } from "zod";

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

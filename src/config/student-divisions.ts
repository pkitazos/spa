import { z } from "zod";

export const studentTypeSchema = z.object({
  id: z.string(),
  markingGroup: z.string(),
  allocationDivision: z.string(),
});

export type StudentType = z.infer<typeof studentTypeSchema>;

export const LEVEL_4_HONS: StudentType = {
  id: "LEVEL_4",
  markingGroup: "PAUL",
  allocationDivision: "PAUL",
};

export const SEYP: StudentType = {
  id: "SEYP",
  markingGroup: "PAUL",
  allocationDivision: "PAUL",
};

export const LEVEL_5_HONS: StudentType = {
  id: "LEVEL_5",
  markingGroup: "YIANNIS",
  allocationDivision: "YIANNIS",
};

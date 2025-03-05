import { z } from "zod";

export const ReaderAssignmentResult = {
  OK: "OK",
  MISSING_STUDENT: "MISSING_STUDENT",
  MISSING_READER: "MISSING_READER",
} as const;

export const readerAssignmentResultSchema = z.enum([
  ReaderAssignmentResult.OK,
  ReaderAssignmentResult.MISSING_STUDENT,
  ReaderAssignmentResult.MISSING_READER,
]);

export type ReaderAssignmentResult = z.infer<
  typeof readerAssignmentResultSchema
>;

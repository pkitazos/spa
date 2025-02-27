import { Prisma } from "@prisma/client";

import {
  blankResult,
  matchingServiceResponseSchema,
} from "@/lib/validations/matching";

// TODO: add docs + figure out where this was used
export function extractMatchingDetails(
  allStudents: { id: string; name: string | null }[],
  allProjects: { id: string; title: string }[],
  studentId: string,
  projectId: string,
  studentRank: number,
) {
  const studentIdx = allStudents.findIndex(
    (student) => student.id === studentId,
  );
  if (studentIdx === -1) throw new Error("Student not found");

  const student = allStudents[studentIdx];

  if (projectId === "0") {
    return {
      studentId,
      studentName: student.name!,
      projectId: "-",
      projectTitle: "-",
      studentRank: NaN,
    };
  }

  const projectIdx = allProjects.findIndex(
    (project) => project.id === projectId,
  );

  if (projectIdx === -1) throw new Error(`Project not found: ${projectId}`);

  return {
    studentId,
    studentName: student.name!,
    projectId,
    projectTitle: allProjects[projectIdx].title,
    studentRank,
  };
}

export function parseMatchingResult(data: Prisma.JsonValue) {
  const res = matchingServiceResponseSchema.safeParse(
    JSON.parse(data as string),
  );
  return res.success ? res.data : blankResult;
}

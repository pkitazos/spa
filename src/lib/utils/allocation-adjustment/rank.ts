// MOVE somewhere else
import {
  ProjectInfo,
  StudentRow,
} from "@/lib/validations/allocation-adjustment";

import { getStudent } from "./student";

function getStudentProjectIds(row: StudentRow): string[] {
  return row.projects.map((p) => p.id);
}

function getProjectRank(projectIds: string[], projectId: string): number {
  return projectIds.findIndex((id) => id === projectId) + 1;
}

export function getStudentRank(
  allStudents: StudentRow[],
  studentId: string,
  projectId: string,
): number {
  const student = getStudent(allStudents, studentId);
  const projectIds = getStudentProjectIds(student);
  return getProjectRank(projectIds, projectId);
}

export function getAllocPairs(allProjects: ProjectInfo[]) {
  return allProjects.flatMap((p) =>
    p.allocatedTo.map((userId) => ({ projectId: p.id, userId })),
  );
}

import {
  type ProjectInfo,
  type StudentRow,
} from "@/lib/validations/allocation-adjustment";

import { getAsProjects } from "./project";

function getStudentProjects(allProjects: ProjectInfo[], row: StudentRow) {
  return getAsProjects(allProjects, row.projects);
}

function getProjectAllocations(projects: ProjectInfo[]) {
  return projects.map((e) => e.allocatedTo);
}

function getStudentAllocationIndex(alloc: string[][], studentId: string) {
  return alloc.findIndex((a) => a.includes(studentId));
}

export function getPreferenceRank(allProjects: ProjectInfo[], row: StudentRow) {
  const studentProjects = getStudentProjects(allProjects, row);
  const allocations = getProjectAllocations(studentProjects);
  return getStudentAllocationIndex(allocations, row.student.id);
}

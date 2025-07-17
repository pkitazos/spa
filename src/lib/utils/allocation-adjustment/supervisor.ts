import {
  type ProjectInfo,
  type SupervisorDetails,
} from "@/lib/validations/allocation-adjustment";

import { getProjectInfo } from "./project";

export function getCurrentCapacity(
  allProjects: ProjectInfo[],
  s: SupervisorDetails,
) {
  return s.projects.filter((id) => {
    const project = getProjectInfo(allProjects, id);
    return project.allocatedTo.length !== 0;
  }).length;
}

export function withinCapacity(
  allProjects: ProjectInfo[],
  s: SupervisorDetails,
) {
  const capacity = getCurrentCapacity(allProjects, s);
  return capacity >= s.lowerBound && capacity <= s.upperBound;
}

export function allSupervisorsValid(
  allProjects: ProjectInfo[],
  supervisors: SupervisorDetails[],
) {
  return supervisors.map((s) => withinCapacity(allProjects, s)).every(Boolean);
}

export function getProjectSupervisor(
  project: ProjectInfo,
  allSupervisors: SupervisorDetails[],
) {
  const idx = allSupervisors.findIndex((s) => s.projects.includes(project.id));
  return allSupervisors[idx];
}

import {
  type ProjectInfo,
  type RowProject,
} from "@/lib/validations/allocation-adjustment";

export function withinBounds(project: ProjectInfo) {
  const { capacityLowerBound, capacityUpperBound, allocatedTo } = project;
  return (
    capacityLowerBound <= allocatedTo.length &&
    allocatedTo.length <= capacityUpperBound
  );
}

export function getProjectInfo(allProjects: ProjectInfo[], projectId: string) {
  return allProjects.find((p) => p.id === projectId)!;
}

export function toProjectInfos(
  allProjects: ProjectInfo[],
  projectIds: string[],
) {
  return allProjects.filter((p) => projectIds.includes(p.id));
}

export function getAsProjects(
  allProjects: ProjectInfo[],
  rowProjects: RowProject[],
) {
  const projectIds = rowProjects.map((p) => p.id);
  return toProjectInfos(allProjects, projectIds);
}

export function replaceUpdated(
  oldProjects: ProjectInfo[],
  updatedProjects: ProjectInfo[],
) {
  return oldProjects.map((row) => {
    const idx = updatedProjects.findIndex(({ id }) => id === row.id);
    return idx === -1 ? row : updatedProjects[idx];
  });
}

export function allProjectsValid(allProjects: ProjectInfo[]) {
  return allProjects.map(withinBounds).every(Boolean);
}

import { AllocationInstance, Role, Stage } from "@prisma/client";

import { TabGroup } from "./index";

import { PAGES } from "@/config/pages";

function adminOnlyTabs<
  T extends {
    stage: Stage;
    parentInstanceId: string | null;
    forkedInstanceId: string | null;
  },
>(instance: T) {
  const branchingTab = getInstanceBranchingTab(instance);
  const tabs = {
    [Stage.SETUP]: [PAGES.addStudents, PAGES.addSupervisors],

    [Stage.PROJECT_SUBMISSION]: [
      PAGES.supervisorInvites,
      PAGES.projectSubmissions,
      PAGES.preAllocatedProjects,
      PAGES.addStudents,
      PAGES.addSupervisors,
    ],
    [Stage.PROJECT_SELECTION]: [
      PAGES.studentInvites,
      PAGES.preferenceSubmissions,
      PAGES.lateProposals,
      PAGES.preAllocatedProjects,
      PAGES.addStudents,
      PAGES.addSupervisors,
    ],
    [Stage.PROJECT_ALLOCATION]: [
      PAGES.algorithms,
      PAGES.results,
      PAGES.preferenceStatistics,
      PAGES.preferenceSubmissions,
      PAGES.preAllocatedProjects,
    ],
    [Stage.ALLOCATION_ADJUSTMENT]: [
      PAGES.manualChanges,
      PAGES.randomAllocations,
      PAGES.results,
      PAGES.preferenceStatistics,
      PAGES.preferenceSubmissions,
      PAGES.preAllocatedProjects,
    ],
    [Stage.ALLOCATION_PUBLICATION]: [
      PAGES.manageUserAccess,
      PAGES.allocationOverview,
      PAGES.exportToCSV,
      ...branchingTab,
      PAGES.preferenceStatistics,
      PAGES.preferenceSubmissions,
    ],
  };
  return tabs[instance.stage];
}

function supervisorOnlyTabs(instance: AllocationInstance) {
  const myAllocationsTab = instance.supervisorAllocationAccess
    ? [PAGES.myAllocations]
    : [];

  const tabs = {
    [Stage.SETUP]: [],
    [Stage.PROJECT_SUBMISSION]: [PAGES.myProjects, PAGES.newProject],
    [Stage.PROJECT_SELECTION]: [PAGES.myProjects, PAGES.newProject],
    [Stage.PROJECT_ALLOCATION]: [PAGES.myProjects],
    [Stage.ALLOCATION_ADJUSTMENT]: [PAGES.myProjects],
    [Stage.ALLOCATION_PUBLICATION]: [PAGES.myProjects, ...myAllocationsTab],
  };
  return tabs[instance.stage];
}

const studentOnlyTabs = (
  instance: AllocationInstance,
  preAllocatedProject: boolean,
) => {
  const base = preAllocatedProject ? [] : [PAGES.myPreferences];

  const myAllocationTab = instance.studentAllocationAccess
    ? [PAGES.myAllocation]
    : [];

  const tabs = {
    [Stage.SETUP]: [],
    [Stage.PROJECT_SUBMISSION]: [],
    [Stage.PROJECT_SELECTION]: base,
    [Stage.PROJECT_ALLOCATION]: base,
    [Stage.ALLOCATION_ADJUSTMENT]: base,
    [Stage.ALLOCATION_PUBLICATION]: myAllocationTab,
  };
  return tabs[instance.stage];
};

export function getTabs({
  roles,
  instance,
  preAllocatedProject,
}: {
  roles: Set<Role>;
  instance: AllocationInstance & { forkedInstanceId: string | null };
  preAllocatedProject: boolean;
}): TabGroup[] {
  const tabs = [];

  if (roles.has(Role.ADMIN)) {
    tabs.push({
      title: "Admin",
      tabs: [PAGES.stageControl, PAGES.settings],
    });

    tabs.push({
      title: "Stage-specific",
      tabs: adminOnlyTabs(instance),
    });
  }

  if (roles.has(Role.SUPERVISOR)) {
    const isSecondRole = roles.size > 1;
    const base = supervisorOnlyTabs(instance);

    tabs.push({
      title: "Supervisor",
      tabs: !isSecondRole
        ? [PAGES.instanceTasks, ...base]
        : instance.stage === Stage.SETUP
          ? base
          : [PAGES.supervisorTasks, ...base],
    });
  }

  if (roles.has(Role.STUDENT)) {
    const isSecondRole = roles.size > 1;
    const base = studentOnlyTabs(instance, preAllocatedProject);

    tabs.push({
      title: "Student",
      tabs: isSecondRole ? base : [PAGES.instanceTasks, ...base],
    });
  }

  return tabs;
}

function getInstanceBranchingTab<
  T extends {
    parentInstanceId: string | null;
    forkedInstanceId: string | null;
  },
>(instance: T) {
  if (instance.parentInstanceId) return [PAGES.mergeInstance];
  if (!instance.forkedInstanceId) return [PAGES.forkInstance];
  return [];
}

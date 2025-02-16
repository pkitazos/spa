import { PAGES } from "@/config/pages";

/**
 * All the tabs visible to a supervisor (EVER)
 */
export const SUPERVISOR_TABS = [
  PAGES.allProjects,
  PAGES.myProjects,
  PAGES.newProject,
  PAGES.myAllocations,
];

/**
 * All the tabs visible to a student (EVER)
 */
export const STUDENT_TABS = [
  PAGES.allProjects,
  PAGES.myPreferences,
  PAGES.myAllocation,
];

/**
 * All the tabs visible to an admin (EVER)
 */
export const ADMIN_TABS = [
  PAGES.settings,
  PAGES.stageControl,
  PAGES.addSupervisors,
  PAGES.addStudents,
  PAGES.supervisorInvites,
  PAGES.projectSubmissions,
  PAGES.preAllocatedProjects,
  PAGES.studentInvites,
  PAGES.preferenceSubmissions,
  PAGES.lateProposals,
  PAGES.algorithms,
  PAGES.results,
  PAGES.preferenceStatistics,
  PAGES.manualChanges,
  PAGES.allocationOverview,
  PAGES.forkInstance,
  PAGES.mergeInstance,
  PAGES.exportToCSV,
  PAGES.supervisorTasks,
];

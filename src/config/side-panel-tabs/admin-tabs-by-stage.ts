import { TabType } from "@/lib/validations/tabs";

import { PAGES } from "@/config/pages";
import { Stage } from "@/db/types";

export const ADMIN_TABS_BY_STAGE: Record<Stage, TabType[]> = {
  [Stage.SETUP]: [PAGES.addStudents, PAGES.addSupervisors],

  [Stage.PROJECT_SUBMISSION]: [
    PAGES.supervisorInvites,
    PAGES.projectSubmissions,
    PAGES.preAllocatedProjects,
    PAGES.addStudents,
    PAGES.addSupervisors,
  ],
  [Stage.STUDENT_BIDDING]: [
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
    // ! Note: branch tab injected in side-panel/admin-only tabs
    PAGES.preferenceStatistics,
    PAGES.preferenceSubmissions,
  ],
  // TODO: fill these in
  [Stage.READER_BIDDING]: [PAGES.uploadReadings],
  [Stage.READER_ALLOCATION]: [PAGES.uploadReadings],
  [Stage.MARK_SUBMISSION]: [PAGES.unitsOfAssessment],
  [Stage.GRADE_PUBLICATION]: [],
};

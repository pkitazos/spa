import { PAGES } from "@/config/pages";

import { Stage } from "@/db/types";

import { type TabType } from "@/lib/validations/tabs";

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
    PAGES.manualAllocations,
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
    PAGES.preferenceStatistics,
    PAGES.preferenceSubmissions,
  ],
  // TODO: fill these in
  [Stage.READER_BIDDING]: [PAGES.uploadReadings],
  [Stage.READER_ALLOCATION]: [PAGES.uploadReadings],
  [Stage.MARK_SUBMISSION]: [PAGES.unitsOfAssessment, PAGES.markingOverview],
  [Stage.GRADE_PUBLICATION]: [],
};

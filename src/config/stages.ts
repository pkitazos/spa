import { Role, Stage } from "@/db/types";

import { subsequentStages } from "@/lib/utils/permissions/stage-check";

export const supervisorStages: Stage[] = [Stage.SETUP];

export const studentStages: Stage[] = [Stage.SETUP, Stage.PROJECT_SUBMISSION];

export const readerStages: Stage[] = subsequentStages(
  Stage.ALLOCATION_PUBLICATION,
);

type StageInfo = {
  id: Stage;
  number: number;
  displayName: string;
  description: string;
  permittedRoles: Role[];
};

export const STAGES: Record<Stage, StageInfo> = {
  [Stage.SETUP]: {
    id: Stage.SETUP,
    number: 1,
    displayName: "Setup",
    description:
      "Initial setup of the instance, including configuration and adding users.",
    permittedRoles: [Role.ADMIN],
  },

  [Stage.PROJECT_SUBMISSION]: {
    id: Stage.PROJECT_SUBMISSION,
    number: 2,
    displayName: "Project Submission",
    description: "Supervisors can submit projects for students.",
    permittedRoles: [Role.ADMIN, Role.SUPERVISOR],
  },

  [Stage.STUDENT_BIDDING]: {
    id: Stage.STUDENT_BIDDING,
    number: 3,
    displayName: "Student Bidding",
    description: "Students can bid on projects.",
    permittedRoles: [Role.ADMIN, Role.SUPERVISOR, Role.STUDENT],
  },

  [Stage.PROJECT_ALLOCATION]: {
    id: Stage.PROJECT_ALLOCATION,
    number: 4,
    displayName: "Project Allocation",
    description: "Projects are allocated to students based on bids.",
    permittedRoles: [Role.ADMIN, Role.SUPERVISOR, Role.STUDENT],
  },

  [Stage.ALLOCATION_ADJUSTMENT]: {
    id: Stage.ALLOCATION_ADJUSTMENT,
    number: 5,
    displayName: "Allocation Adjustment",
    description: "Manual adjustments can be made to the project allocations.",
    permittedRoles: [Role.ADMIN, Role.SUPERVISOR, Role.STUDENT],
  },

  [Stage.ALLOCATION_PUBLICATION]: {
    id: Stage.ALLOCATION_PUBLICATION,
    number: 6,
    displayName: "Allocation Publication",
    description: "Final publication of project allocations.",
    permittedRoles: [Role.ADMIN, Role.SUPERVISOR, Role.STUDENT],
  },

  [Stage.READER_BIDDING]: {
    id: Stage.READER_BIDDING,
    number: 7,
    displayName: "Reader Bidding",
    description: "Readers can bid on projects.",
    permittedRoles: [Role.ADMIN, Role.SUPERVISOR, Role.READER],
  },

  [Stage.READER_ALLOCATION]: {
    id: Stage.READER_ALLOCATION,
    number: 8,
    displayName: "Reader Allocation",
    description: "Readers are allocated to projects based on bids.",
    permittedRoles: [Role.ADMIN, Role.SUPERVISOR, Role.READER],
  },

  [Stage.MARK_SUBMISSION]: {
    id: Stage.MARK_SUBMISSION,
    number: 9,
    displayName: "Mark Submission",
    description: "Readers and Supervisors submit marks for projects.",
    permittedRoles: [Role.ADMIN, Role.SUPERVISOR, Role.READER],
  },

  [Stage.GRADE_PUBLICATION]: {
    id: Stage.GRADE_PUBLICATION,
    number: 10,
    displayName: "Grade Publication",
    description:
      "Readers and Supervisors can view the published grades for projects.",
    permittedRoles: [Role.ADMIN, Role.SUPERVISOR, Role.READER],
  },
};

export function getStageLabel(s: Stage) {
  return STAGES[s].displayName;
}

// TODO: somehow merge these two

export const CHAPTER = {
  ALLOCATION: {
    SETUP: { id: Stage.SETUP, displayName: "Setup" },
    PROJECT_SUBMISSION: {
      id: Stage.PROJECT_SUBMISSION,
      displayName: "Project Submission",
    },
    STUDENT_BIDDING: {
      id: Stage.STUDENT_BIDDING,
      displayName: "Student Bidding",
    },
    PROJECT_ALLOCATION: {
      id: Stage.PROJECT_ALLOCATION,
      displayName: "Project Allocation",
    },
    ALLOCATION_ADJUSTMENT: {
      id: Stage.ALLOCATION_ADJUSTMENT,
      displayName: "Allocation Adjustment",
    },
    ALLOCATION_PUBLICATION: {
      id: Stage.ALLOCATION_PUBLICATION,
      displayName: "Allocation Publication",
    },
  },
  MARKING: {
    READER_BIDDING: { id: Stage.READER_BIDDING, displayName: "Reader Bidding" },
    READER_ALLOCATION: {
      id: Stage.READER_ALLOCATION,
      displayName: "Reader Allocation",
    },
    MARK_SUBMISSION: {
      id: Stage.MARK_SUBMISSION,
      displayName: "Mark Submission",
    },
    GRADE_PUBLICATION: {
      id: Stage.GRADE_PUBLICATION,
      displayName: "Grade Publication",
    },
  },
};

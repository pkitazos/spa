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
  name: string;
  description: string;
  permittedRoles: Role[];
};

export const STAGES: Record<Stage, StageInfo> = {
  [Stage.SETUP]: {
    id: Stage.SETUP,
    number: 1,
    name: "Setup",
    description:
      "Initial setup of the instance, including configuration and adding users.",
    permittedRoles: [Role.ADMIN],
  },

  [Stage.PROJECT_SUBMISSION]: {
    id: Stage.PROJECT_SUBMISSION,
    number: 2,
    name: "Project Submission",
    description: "Supervisors can submit projects for students.",
    permittedRoles: [Role.ADMIN, Role.SUPERVISOR],
  },

  [Stage.STUDENT_BIDDING]: {
    id: Stage.STUDENT_BIDDING,
    number: 3,
    name: "Student Bidding",
    description: "Students can bid on projects.",
    permittedRoles: [Role.ADMIN, Role.SUPERVISOR, Role.STUDENT],
  },

  [Stage.PROJECT_ALLOCATION]: {
    id: Stage.PROJECT_ALLOCATION,
    number: 4,
    name: "Project Allocation",
    description: "Projects are allocated to students based on bids.",
    permittedRoles: [Role.ADMIN, Role.SUPERVISOR, Role.STUDENT],
  },

  [Stage.ALLOCATION_ADJUSTMENT]: {
    id: Stage.ALLOCATION_ADJUSTMENT,
    number: 5,
    name: "Allocation Adjustment",
    description: "Manual adjustments can be made to the project allocations.",
    permittedRoles: [Role.ADMIN, Role.SUPERVISOR, Role.STUDENT],
  },

  [Stage.ALLOCATION_PUBLICATION]: {
    id: Stage.ALLOCATION_PUBLICATION,
    number: 6,
    name: "Allocation Publication",
    description: "Final publication of project allocations.",
    permittedRoles: [Role.ADMIN, Role.SUPERVISOR, Role.STUDENT],
  },

  [Stage.READER_BIDDING]: {
    id: Stage.READER_BIDDING,
    number: 0,
    name: "Reader Bidding",
    description: "Readers can bid on projects.",
    permittedRoles: [Role.ADMIN, Role.SUPERVISOR, Role.READER],
  },

  [Stage.READER_ALLOCATION]: {
    id: Stage.READER_ALLOCATION,
    number: 0,
    name: "Reader Allocation",
    description: "Readers are allocated to projects based on bids.",
    permittedRoles: [Role.ADMIN, Role.SUPERVISOR, Role.READER],
  },

  [Stage.MARK_SUBMISSION]: {
    id: Stage.MARK_SUBMISSION,
    number: 0,
    name: "Mark Submission",
    description: "Readers and Supervisors submit marks for projects.",
    permittedRoles: [Role.ADMIN, Role.SUPERVISOR, Role.READER],
  },

  [Stage.GRADE_PUBLICATION]: {
    id: Stage.GRADE_PUBLICATION,
    number: 0,
    name: "Grade Publication",
    description:
      "Readers and Supervisors can view the published grades for projects.",
    permittedRoles: [Role.ADMIN, Role.SUPERVISOR, Role.READER],
  },
};

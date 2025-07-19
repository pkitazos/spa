import { Stage } from "@/db/types";

// TODO: merge this with the stages.ts file in src/config

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

import { v4 as uuidv4 } from "uuid";
import { immer } from "zustand/middleware/immer";
import { createStore } from "zustand/vanilla";

import { type MarkerType } from "@/db/types";

export type Classification = {
  title: string;
  description?: string;
  submissions: ClassificationSubmission[];
};

type ClassificationSubmission = {
  title: string;
  studentSubmissionDeadline: Date;
  markerSubmissionDeadline: Date;
  components: Record<MarkerType, AssessmentCriterion[]>;
};

export type AssessmentCriterion = {
  id: string;
  name: string;
  weight: number;
  description: string;
  rank: number;
};

export type State = {
  flags: Classification[];
  selectedFlagIndex: number | undefined;
  selectedSubmissionIndex: number | undefined;
};

type Actions = {
  setTabPosition: (
    flagIdx: number | undefined,
    submissionIdx: number | undefined,
  ) => void;

  createFlag: (flag: Classification) => void;
  updateFlag: (index: number, flag: Classification) => void;
  deleteFlag: (index: number) => void;

  createSubmission: (
    flagIndex: number,
    submission: ClassificationSubmission,
  ) => void;
  updateSubmission: (
    flagIndex: number,
    submissionIndex: number,
    submission: ClassificationSubmission,
  ) => void;
  deleteSubmission: (flagIndex: number, submissionIndex: number) => void;

  createCriterion: (
    flagIndex: number,
    submissionIndex: number,
    markerType: MarkerType,
    criterion: Omit<AssessmentCriterion, "id">,
  ) => void;

  createCriterionAtIndex: (
    flagIndex: number,
    submissionIndex: number,
    markerType: MarkerType,
    criterion: Omit<AssessmentCriterion, "id">,
    index: number,
  ) => void;

  updateCriterion: (
    flagIndex: number,
    submissionIndex: number,
    markerType: MarkerType,
    criterionId: string,
    criterion: AssessmentCriterion,
  ) => void;

  deleteCriterion: (
    flagIndex: number,
    submissionIndex: number,
    markerType: MarkerType,
    criterionId: string,
  ) => void;
};

export type MarkingSchemeStore = State & Actions;

export function createMarkingSchemeStore(initState: State) {
  return createStore<MarkingSchemeStore>()(
    immer((set) => ({
      ...initState,

      setTabPosition: (flagIdx, submissionIdx) =>
        set((s) => {
          s.selectedFlagIndex = flagIdx;
          s.selectedSubmissionIndex = submissionIdx;
        }),

      createFlag: (flag) =>
        set((state) => {
          state.flags.push(flag);
        }),

      updateFlag: (index, flag) =>
        set((state) => {
          state.flags[index] = flag;
        }),

      deleteFlag: (index) =>
        set((state) => {
          state.flags.splice(index, 1);
        }),

      createSubmission: (flagIndex, submission) =>
        set((state) => {
          const new_submission: ClassificationSubmission = {
            ...submission,
            components: { SUPERVISOR: [], READER: [] },
          };

          state.flags[flagIndex].submissions.push(new_submission);
        }),

      updateSubmission: (flagIndex, submissionIndex, submission) =>
        set((state) => {
          state.flags[flagIndex].submissions[submissionIndex] = submission;
        }),

      deleteSubmission: (flagIndex, submissionIndex) =>
        set((state) => {
          state.flags[flagIndex].submissions.splice(submissionIndex, 1);
        }),

      createCriterion: (flagIndex, submissionIndex, markerType, criterion) =>
        set((state) => {
          state.flags[flagIndex].submissions[submissionIndex].components[
            markerType
          ].push({ ...criterion, id: uuidv4() });
        }),

      createCriterionAtIndex: (
        flagIndex,
        submissionIndex,
        markerType,
        criterion,
        index,
      ) =>
        set((state) => {
          state.flags[flagIndex].submissions[submissionIndex].components[
            markerType
          ].splice(index, 0, { ...criterion, id: uuidv4() });
        }),

      updateCriterion: (
        flagIndex,
        submissionIndex,
        markerType,
        criterionId,
        criterion,
      ) =>
        set((s) => {
          const criteria =
            s.flags[flagIndex].submissions[submissionIndex].components[
              markerType
            ];

          const criterionIdx = criteria.findIndex((c) => c.id === criterionId);
          criteria[criterionIdx] = criterion;
          criteria.sort(sortByRank);
        }),

      deleteCriterion: (flagIndex, submissionIndex, markerType, criterionId) =>
        set((state) => {
          const component =
            state.flags[flagIndex].submissions[submissionIndex].components[
              markerType
            ];

          const criterionIdx = component.findIndex((c) => c.id === criterionId);
          component.splice(criterionIdx, 1);
        }),
    })),
  );
}

const sortByRank = (a: AssessmentCriterion, b: AssessmentCriterion) =>
  a.rank - b.rank;

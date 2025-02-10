import { MarkerType } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { immer } from "zustand/middleware/immer";
import { createStore } from "zustand/vanilla";

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
            components: {
              SUPERVISOR: [],
              READER: [],
            },
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

// Okay so, a couple things to note here:

// 1. there must be at least 1 flag in the store at all times
// so we can ignore the case where there are no flags in the store
// we can also ignore the case where there are no submissions in a flag
// because you can't have a flag with no submissions
// this eliminates our need to check for null values in the store

// 2. rather than having these opaque actions that take an index and a new value
// we should do this in a more functional way
// i.e. we take in the previous state and return the new state
// well, I guess the point of immer is that it does that internally and just gives us a nice API to work with
// but it just feels a bit opaque because we're not really sure what's going on under the hood

// 3. we need to rethink where the search params get updated.
// Perhaps what we should do is just worry about updating the state
// and then have an effect that updates the search params based on the state
// this way we can ensure that the state is always the source of truth
// and we don't have to worry about the search params getting out of sync with the state
// hmmm, not sure about this

// 4. the internal state of the editable text components should be managed by the store
// as in rather than passing in the flag/submission object
// we should just pass in the index and grab the state from our store to avoid prop drilling and out of sync state

// 5. I'm not sure how to verify this, but the keys on some of the sidebar tabs may not be unique
// this was previously causing us issues thought now it seems like it's working fine
// but we should still verify this and perhaps consider a hash function to generate unique keys

// (Optional) put this store in a provider and just treat it like a regular context

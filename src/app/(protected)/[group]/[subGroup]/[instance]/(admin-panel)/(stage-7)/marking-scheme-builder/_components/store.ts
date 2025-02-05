"use client";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

type AssessmentCriterion = {
  name: string;
  weight: number;
  description: string;
};

type MarkerComponents = {
  SUPERVISOR: AssessmentCriterion[];
  READER: AssessmentCriterion[];
};

export type FlagSubmission = {
  title: string;
  studentSubmissionDeadline: Date;
  markerSubmissionDeadline: Date;
  components: MarkerComponents;
};

export type FlagMarkingScheme = {
  title: string;
  description?: string;
  submissions: FlagSubmission[];
};

interface MarkingSchemeState {
  flags: FlagMarkingScheme[];
  selectedFlagIndex: number | null;
  selectedSubmissionIndex: number | null;

  // Flag actions
  addFlag: (flag: Omit<FlagMarkingScheme, "submissions">) => void;

  updateFlag: (
    index: number,
    flag: Omit<FlagMarkingScheme, "submissions">,
  ) => void;

  removeFlag: (index: number) => void;

  setFlags: (flags: FlagMarkingScheme[]) => void;

  // Submission actions
  addSubmission: (flagIndex: number, submission: FlagSubmission) => void;

  updateSubmission: (
    flagIndex: number,
    submissionIndex: number,
    submission: FlagSubmission,
  ) => void;

  removeSubmission: (flagIndex: number, submissionIndex: number) => void;

  setSubmissions: (flagIndex: number, submissions: FlagSubmission[]) => void;

  // Component actions
  updateComponents: (
    flagIndex: number,
    submissionIndex: number,
    markerType: keyof MarkerComponents,
    components: AssessmentCriterion[],
  ) => void;

  // Selection actions
  setSelectedFlag: (index: number | null) => void;
  setSelectedSubmission: (index: number | null) => void;
}

export const useMarkingSchemeStore = create<MarkingSchemeState>()(
  immer((set) => ({
    flags: [],
    selectedFlagIndex: null,
    selectedSubmissionIndex: null,

    // Flag actions
    addFlag: (flag) =>
      set((state) => {
        state.flags.push({ ...flag, submissions: [] });
      }),

    updateFlag: (index, flag) =>
      set((state) => {
        if (state.flags[index]) {
          state.flags[index] = { ...state.flags[index], ...flag };
        }
      }),

    removeFlag: (index) =>
      set((state) => {
        state.flags.splice(index, 1);
        if (state.selectedFlagIndex === index) {
          state.selectedFlagIndex = null;
          state.selectedSubmissionIndex = null;
        }
      }),

    setFlags: (flags) =>
      set((state) => {
        state.flags = flags;
      }),

    // Submission actions
    addSubmission: (flagIndex, submission) =>
      set((state) => {
        if (state.flags[flagIndex]) {
          state.flags[flagIndex].submissions.push(submission);
        }
      }),

    updateSubmission: (flagIndex, submissionIndex, submission) =>
      set((state) => {
        if (
          state.flags[flagIndex] &&
          state.flags[flagIndex].submissions[submissionIndex]
        ) {
          state.flags[flagIndex].submissions[submissionIndex] = submission;
        }
      }),

    removeSubmission: (flagIndex, submissionIndex) =>
      set((state) => {
        if (state.flags[flagIndex]) {
          state.flags[flagIndex].submissions.splice(submissionIndex, 1);
          if (state.selectedSubmissionIndex === submissionIndex) {
            state.selectedSubmissionIndex = null;
          }
        }
      }),

    setSubmissions: (flagIndex, submissions) =>
      set((state) => {
        if (state.flags[flagIndex]) {
          state.flags[flagIndex].submissions = submissions;
        }
      }),

    // Component actions
    updateComponents: (flagIndex, submissionIndex, markerType, components) =>
      set((state) => {
        if (
          state.flags[flagIndex] &&
          state.flags[flagIndex].submissions[submissionIndex]
        ) {
          state.flags[flagIndex].submissions[submissionIndex].components[
            markerType
          ] = components;
        }
      }),

    // Selection actions
    setSelectedFlag: (index) =>
      set((state) => {
        state.selectedFlagIndex = index;
        state.selectedSubmissionIndex = null;
      }),

    setSelectedSubmission: (index) =>
      set((state) => {
        state.selectedSubmissionIndex = index;
      }),
  })),
);

// Selector hooks for convenience
export const useSelectedFlag = () =>
  useMarkingSchemeStore((state) => {
    const { flags, selectedFlagIndex } = state;
    return selectedFlagIndex !== null ? flags[selectedFlagIndex] : null;
  });

export const useSelectedSubmission = () =>
  useMarkingSchemeStore((state) => {
    const { flags, selectedFlagIndex, selectedSubmissionIndex } = state;
    return selectedFlagIndex !== null && selectedSubmissionIndex !== null
      ? flags[selectedFlagIndex].submissions[selectedSubmissionIndex]
      : null;
  });

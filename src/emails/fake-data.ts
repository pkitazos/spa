import { MarkingSubmissionDTO } from "@/dto";
import { addWeeks } from "date-fns";

export const fakeProject = {
  id: "",
  title: "Testing Programmatic Emails",
  description: "",
  latestEditDateTime: new Date(),
  capacityLowerBound: 0,
  capacityUpperBound: 0,
  supervisorId: "",
  flags: [],
  tags: [],
};

export const fakeSupervisor = {
  id: "",
  email: "emily.smith@uni.ac.uk",
  name: "Emily Smith",
  joined: false,
  allocationTarget: 0,
  allocationLowerBound: 0,
  allocationUpperBound: 0,
};

export const fakeReader = {
  id: "",
  email: "sam.blankman@uni.ac.uk",
  name: "Sam Blankman",
  joined: false,
  allocationTarget: 0,
  allocationLowerBound: 0,
  allocationUpperBound: 0,
};

export const fakeStudent = {
  id: "3858475d",
  email: "",
  name: "John Doe",
  joined: false,
  flags: [],
  level: 0,
};

export const fakeUnit = {
  id: "9ee86629-4e6c-4572-bea5-2c2dc695e6d4",
  title: "Dissertation",
  studentSubmissionDeadline: new Date(),
  markerSubmissionDeadline: new Date(),
  weight: 0,
  isOpen: false,
  components: [],
  flag: { id: "", title: "", description: "" },
  allowedMarkerTypes: [],
};

export const fakeCriteria = [
  {
    id: "828267e6-ba81-4dc4-877a-956a81134583",
    unitOfAssessmentId: "6615b424-1e9d-41a1-892a-97369210c7fe",
    title: "Content",
    description: "some description goes here",
    weight: 10,
    layoutIndex: 0,
  },
  {
    id: "f0dfe468-46de-41bf-bba8-b2f62028dced",
    unitOfAssessmentId: "6615b424-1e9d-41a1-892a-97369210c7fe",
    title: "Use of Visual Aids",
    description: "some description goes here",
    weight: 10,
    layoutIndex: 1,
  },
  {
    id: "446861ff-cf94-4498-a1c7-df2a56639077",
    unitOfAssessmentId: "6615b424-1e9d-41a1-892a-97369210c7fe",
    title: "Questions",
    description: "some description goes here",
    weight: 10,
    layoutIndex: 2,
  },
  {
    id: "ce515944-9b00-4250-a5c7-957ee8cd1c88",
    unitOfAssessmentId: "6615b424-1e9d-41a1-892a-97369210c7fe",
    title: "Delivery",
    description: "some description goes here",
    weight: 10,
    layoutIndex: 3,
  },
];

export const fakeReaderSubmission: MarkingSubmissionDTO = {
  grade: 19,
  unitOfAssessmentId: "6615b424-1e9d-41a1-892a-97369210c7fe",
  studentId: "2558994P",
  markerId: "ba34n",
  marks: {
    "828267e6-ba81-4dc4-877a-956a81134583": {
      mark: 12,
      justification:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum",
    },
    "f0dfe468-46de-41bf-bba8-b2f62028dced": {
      mark: 19,
      justification:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum",
    },
    "446861ff-cf94-4498-a1c7-df2a56639077": {
      mark: 17,
      justification:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum",
    },
    "ce515944-9b00-4250-a5c7-957ee8cd1c88": {
      mark: 15,
      justification:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum",
    },
  },
  finalComment:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum",
  recommendation: false,
  draft: false,
};

export const fakeSupervisorSubmission: MarkingSubmissionDTO = {
  grade: 12,
  unitOfAssessmentId: "6615b424-1e9d-41a1-892a-97369210c7fe",
  studentId: "2558994P",
  markerId: "ba34n",
  marks: {
    "828267e6-ba81-4dc4-877a-956a81134583": {
      mark: 12,
      justification:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum",
    },
    "f0dfe468-46de-41bf-bba8-b2f62028dced": {
      mark: 19,
      justification:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum",
    },
    "446861ff-cf94-4498-a1c7-df2a56639077": {
      mark: 17,
      justification:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum",
    },
    "ce515944-9b00-4250-a5c7-957ee8cd1c88": {
      mark: 15,
      justification:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum",
    },
  },
  finalComment:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum",
  recommendation: false,
  draft: true,
};

export const fakeDeadline = addWeeks(new Date(), 1);

export const fakeParams = {
  group: "socs",
  subGroup: "lvl-4-and-lvl-5-honours",
  instance: "2024-2025",
};

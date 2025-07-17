import { addWeeks } from "date-fns";

import { type MarkingSubmissionDTO } from "@/dto";

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

export const fakeThirdMarker = {
  id: "",
  email: "person.personson@uni.ac.uk",
  name: "Person Personson",
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

export const fakePresentationUnit = {
  id: "presentation-unit-id",
  title: "Presentation",
  studentSubmissionDeadline: new Date(),
  markerSubmissionDeadline: new Date(),
  weight: 0,
  isOpen: false,
  components: [],
  flag: { id: "", title: "", description: "" },
  allowedMarkerTypes: [],
};

export const fakeConductUnit = {
  id: "conduct-unit-id",
  title: "Conduct",
  studentSubmissionDeadline: new Date(),
  markerSubmissionDeadline: new Date(),
  weight: 0,
  isOpen: false,
  components: [],
  flag: { id: "", title: "", description: "" },
  allowedMarkerTypes: [],
};

export const fakeDissertationUnit = {
  id: "dissertation-unit-id",
  title: "Dissertation",
  studentSubmissionDeadline: new Date(),
  markerSubmissionDeadline: new Date(),
  weight: 0,
  isOpen: false,
  components: [],
  flag: { id: "", title: "", description: "" },
  allowedMarkerTypes: [],
};

export const fakePresentationCriteria = [
  {
    id: "p1-content",
    unitOfAssessmentId: "presentation-unit-id",
    title: "Content",
    description: "some description goes here",
    weight: 10,
    layoutIndex: 0,
  },
  {
    id: "p2-visual-aids",
    unitOfAssessmentId: "presentation-unit-id",
    title: "Use of Visual Aids",
    description: "some description goes here",
    weight: 10,
    layoutIndex: 1,
  },
  {
    id: "p3-questions",
    unitOfAssessmentId: "presentation-unit-id",
    title: "Questions",
    description: "some description goes here",
    weight: 10,
    layoutIndex: 2,
  },
  {
    id: "p4-delivery",
    unitOfAssessmentId: "presentation-unit-id",
    title: "Delivery",
    description: "some description goes here",
    weight: 10,
    layoutIndex: 3,
  },
];

export const fakeConductCriteria = [
  {
    id: "c1-conduct",
    unitOfAssessmentId: "conduct-unit-id",
    title: "Conduct",
    description:
      "Did the student attend meetings, and engage effectively with the supervisor?",
    weight: 10,
    layoutIndex: 1,
  },
];

export const fakeDissertationCriteria = [
  {
    id: "d1-analysis",
    unitOfAssessmentId: "dissertation-unit-id",
    title: "Analysis",
    description:
      "Has the student surveyed relevant research literature? Has he/she analysed the research problem, and devised a suitable approach for solving the problem?",
    weight: 15,
    layoutIndex: 0,
  },
  {
    id: "d2-evaluation",
    unitOfAssessmentId: "dissertation-unit-id",
    title: "Evaluation",
    description:
      "Has the student critically evaluated and analysed the research results? Does he/she understand their significance? Does he/she have good suggestions for further work?",
    weight: 10,
    layoutIndex: 1,
  },
  {
    id: "d3-quality",
    unitOfAssessmentId: "dissertation-unit-id",
    title: "Dissertation Quality",
    description:
      "Is the research paper well-organised, and literate? Does it clearly explain the research problem, and how it was solved? Does it contain a bibliography and proper citations?",
    weight: 20,
    layoutIndex: 2,
  },
  {
    id: "d4-output-design",
    unitOfAssessmentId: "dissertation-unit-id",
    title: "Output Design",
    description:
      "Has the research been conducted well? Does it show evidence of original thinking? Are there any significant errors? Might the research be worthy of publication, perhaps after revision?",
    weight: 40,
    layoutIndex: 3,
  },
];

// Supervisor Submissions
export const fakeSupervisorConductSubmission: MarkingSubmissionDTO = {
  grade: 18,
  unitOfAssessmentId: "conduct-unit-id",
  studentId: "3858475d",
  markerId: "supervisor-id",
  marks: {
    "c1-conduct": {
      mark: 18,
      justification:
        "Student demonstrated excellent engagement throughout the project. Attended all scheduled meetings, came well-prepared with questions and progress updates. Showed initiative in seeking additional guidance when needed.",
    },
  },
  finalComment:
    "Outstanding conduct throughout the project. The student was professional, engaged, and proactive in their approach to supervision meetings.",
  recommendation: false,
  draft: false,
};

export const fakeSupervisorPresentationSubmission: MarkingSubmissionDTO = {
  grade: 16,
  unitOfAssessmentId: "presentation-unit-id",
  studentId: "3858475d",
  markerId: "supervisor-id",
  marks: {
    "p1-content": {
      mark: 15,
      justification:
        "Good coverage of the research topic with clear explanation of methodology and results. Could have included more discussion of limitations.",
    },
    "p2-visual-aids": {
      mark: 18,
      justification:
        "Excellent use of slides and diagrams. Visual elements were clear, professional, and effectively supported the presentation content.",
    },
    "p3-questions": {
      mark: 16,
      justification:
        "Handled most questions well, demonstrating good understanding of the work. Struggled slightly with more challenging theoretical questions.",
    },
    "p4-delivery": {
      mark: 15,
      justification:
        "Clear speaking voice and good pacing. Could improve eye contact with audience and reduce reliance on notes.",
    },
  },
  finalComment:
    "A solid presentation that effectively communicated the research work. Good use of visual aids and generally confident delivery.",
  recommendation: false,
  draft: false,
};

export const fakeSupervisorMissingPresentationSubmission: MarkingSubmissionDTO =
  {
    grade: 0,
    unitOfAssessmentId: "presentation-unit-id",
    studentId: "3858475d",
    markerId: "supervisor-id",
    marks: {
      "p1-content": {
        mark: -1,
        justification: "No video submitted for the presentation.",
      },
      "p2-visual-aids": {
        mark: -1,
        justification: "No video submitted for the presentation.",
      },
      "p3-questions": {
        mark: -1,
        justification: "No video submitted for the presentation.",
      },
      "p4-delivery": {
        mark: -1,
        justification: "No video submitted for the presentation.",
      },
    },
    finalComment: "No video submitted for the presentation.",
    recommendation: false,
    draft: false,
  };

export const fakeSupervisorDissertationSubmission: MarkingSubmissionDTO = {
  grade: 17,
  unitOfAssessmentId: "dissertation-unit-id",
  studentId: "3858475d",
  markerId: "supervisor-id",
  marks: {
    "d1-analysis": {
      mark: 16,
      justification:
        "Good literature review covering relevant sources. Analysis of the research problem is clear, though could be more comprehensive in considering alternative approaches.",
    },
    "d2-evaluation": {
      mark: 17,
      justification:
        "Strong critical evaluation of results with good understanding of their significance. Suggestions for future work are practical and well-reasoned.",
    },
    "d3-quality": {
      mark: 18,
      justification:
        "Well-organized dissertation with clear structure. Writing is generally clear and professional. Good use of citations and comprehensive bibliography.",
    },
    "d4-output-design": {
      mark: 17,
      justification:
        "Research methodology is sound and well-executed. Shows evidence of original thinking in the approach. Some minor technical issues but overall strong work.",
    },
  },
  finalComment:
    "A well-executed dissertation that demonstrates good research skills and clear communication. The work shows originality and would benefit from minor revisions for potential publication.",
  recommendation: false,
  draft: false,
};

// Reader Submissions (only for dissertation)
export const fakeReaderDissertationSubmission: MarkingSubmissionDTO = {
  grade: 16,
  unitOfAssessmentId: "dissertation-unit-id",
  studentId: "3858475d",
  markerId: "reader-id",
  marks: {
    "d1-analysis": {
      mark: 15,
      justification:
        "Adequate literature review but missing some key recent papers in the field. Problem analysis is sound but could be more thorough.",
    },
    "d2-evaluation": {
      mark: 16,
      justification:
        "Good evaluation of results with appropriate statistical analysis. Understanding of significance is demonstrated well.",
    },
    "d3-quality": {
      mark: 17,
      justification:
        "Well-structured document with clear writing throughout. Citations are appropriate and bibliography is comprehensive.",
    },
    "d4-output-design": {
      mark: 16,
      justification:
        "Solid research execution with appropriate methodology. Some innovative elements but could push boundaries further.",
    },
  },
  finalComment:
    "A competent dissertation that meets the requirements well. The research is solid and the presentation is clear, though there is room for more innovative approaches.",
  recommendation: false,
  draft: false,
};

// Third Marker Submissions (only for dissertation)
export const fakeThirdMarkerDissertationSubmission: MarkingSubmissionDTO = {
  grade: 15,
  unitOfAssessmentId: "dissertation-unit-id",
  studentId: "3858475d",
  markerId: "third-marker-id",
  marks: {
    "d1-analysis": {
      mark: 14,
      justification:
        "Literature review covers the basics but lacks depth in critical analysis. Problem formulation could be more rigorous.",
    },
    "d2-evaluation": {
      mark: 15,
      justification:
        "Reasonable evaluation of results but could benefit from more critical discussion of limitations and alternative interpretations.",
    },
    "d3-quality": {
      mark: 16,
      justification:
        "Generally well-written and organized. Some sections could be more concise and focused.",
    },
    "d4-output-design": {
      mark: 15,
      justification:
        "Competent execution of research plan. Methodology is appropriate but implementation could be more sophisticated.",
    },
  },
  finalComment:
    "This dissertation demonstrates competent research skills and meets the basic requirements. While the work is sound, it lacks the innovation and depth that would distinguish it as exceptional work. The student has shown they can conduct research independently, but there is significant room for improvement in critical analysis and methodological sophistication.",
  recommendation: false,
  draft: false,
};

// Exported Fake Data
export const fakeUnit = fakePresentationUnit;
export const fakeCriteria = fakePresentationCriteria;

export const fakeReaderSubmission = fakeReaderDissertationSubmission;
export const fakeThirdMarkerSubmission = fakeThirdMarkerDissertationSubmission;
export const fakeSupervisorSubmission = fakeSupervisorDissertationSubmission;

export const fakeDeadline = addWeeks(new Date(), 1);

export const fakeParams = {
  group: "socs",
  subGroup: "lvl-4-and-lvl-5-honours",
  instance: "2024-2025",
};

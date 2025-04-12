import {
  AssessmentCriterionDTO,
  MarkingSubmissionDTO,
  ProjectDTO,
  StudentDTO,
  SupervisorDTO,
  UnitOfAssessmentDTO,
} from "@/dto";
import { Heading, Hr, Text } from "@react-email/components";
import { Layout } from "../../components/layout";
import { Marksheet } from "@/emails/components/marksheet";

interface Props {
  project: ProjectDTO;
  supervisor: SupervisorDTO;
  student: StudentDTO;
  supervisorMarking: {
    submission: MarkingSubmissionDTO;
    criteria: AssessmentCriterionDTO[];
    overallGrade: number;
  };
  readerMarking: {
    submission: MarkingSubmissionDTO;
    criteria: AssessmentCriterionDTO[];
    overallGrade: number;
  };
  unit: UnitOfAssessmentDTO;
}

export function ReaderNegotiate1({
  project,
  supervisor,
  student,
  supervisorMarking,
  readerMarking,
  unit,
}: Props) {
  return (
    <Layout previewText="Negotiation1 required">
      <Heading as="h2">{unit.title} Negotiation Required</Heading>
      <Text>
        The grades submitted by the supervisor and reader for the project "
        <i>{project.title}</i>" (student {student.name}, {student.id}){" "}
        <strong>require negotiation</strong> between supervisor and reader.
      </Text>
      <Text>
        Please contact the supervisor <strong>{supervisor.name}</strong> (
        {supervisor.email}) and resolve the difference manually offline.
      </Text>
      <Text>
        Once a resolution reached, <strong>the supervisor</strong> must use the
        link they received in their email to upload the resolution to SPA.
      </Text>
      <Text>
        If a resolution can not be found, please contact the project coordinator
        via email (Level 4: Paul.Harvey@glasgow.ac.uk Level 5:
        Yiannis.Giannakopoulos@glasgow.ac.uk).
      </Text>

      <Text>
        A Breakdown of the marks provided by each of you is provided below:
      </Text>

      <Hr />
      <Heading as="h3">Supervisor Marks:</Heading>
      <Marksheet markingData={supervisorMarking} />
      <Hr />
      <Heading as="h3">Reader Marks:</Heading>
      <Marksheet markingData={readerMarking} />
    </Layout>
  );
}

ReaderNegotiate1.PreviewProps = {
  project: {
    id: "",
    title: "Testing Programmatic Emails",
    description: "",
    latestEditDateTime: new Date(),
    capacityLowerBound: 0,
    capacityUpperBound: 0,
    supervisorId: "",
    flags: [],
    tags: [],
  },
  supervisor: {
    id: "",
    email: "emily.smith@uni.ac.uk",
    name: "Emily Smith",
    joined: false,
    allocationTarget: 0,
    allocationLowerBound: 0,
    allocationUpperBound: 0,
  },
  student: {
    id: "3858475d",
    email: "",
    name: "John Doe",
    joined: false,
    flags: [],
    level: 0,
  },
  supervisorMarking: {
    overallGrade: 22,
    submission: {
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
    },
    criteria: [
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
    ],
  },
  readerMarking: {
    overallGrade: 19,
    submission: {
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
    },
    criteria: [
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
    ],
  },
  unit: {
    id: "",
    title: "Dissertation",
    studentSubmissionDeadline: new Date(),
    markerSubmissionDeadline: new Date(),
    weight: 0,
    isOpen: false,
    components: [],
    flag: { id: "", title: "", description: "" },
    allowedMarkerTypes: [],
  },
} satisfies Props;

export default ReaderNegotiate1;

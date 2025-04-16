import {
  AssessmentCriterionDTO,
  MarkingSubmissionDTO,
  ProjectDTO,
  ReaderDTO,
  StudentDTO,
  UnitOfAssessmentDTO,
} from "@/dto";
import { Button, Hr, Section, Text, Heading } from "@react-email/components";
import { Layout } from "../../components/layout";
import { env } from "@/env";
import { Marksheet } from "@/emails/components/marksheet";
import { InstanceParams } from "@/lib/validations/params";

interface Props {
  project: ProjectDTO;
  reader: ReaderDTO;
  student: StudentDTO;
  unit: UnitOfAssessmentDTO;
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
  params: InstanceParams;
}

export function SupervisorNegotiate1({
  project,
  reader,
  student,
  unit,
  supervisorMarking,
  readerMarking,
  params,
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
        Please contact the reader <strong>{reader.name}</strong> ({reader.email}
        ) and resolve the difference manually offline. Once you have done this:
      </Text>
      <Text>
        1. If you are able to negotiate a new grade,{" "}
        <strong>the supervisor</strong> should submit this using the link below.
      </Text>
      <Text>
        2. In the case where you cannot agree on a grade, please contact the
        project coordinator via email (Level 4: Paul.Harvey@glasgow.ac.uk Level
        5: Yiannis.Giannakopoulos@glasgow.ac.uk), who will arrange for
        moderation.
      </Text>

      <Section className="mb-[32px] mt-[32px] text-center">
        <Button
          className="rounded bg-[#000000] px-5 py-3 text-center text-[12px] font-semibold text-white no-underline"
          href={`${env.SERVER_URL}/${params.group}/${params.subGroup}/${params.instance}/my-marking/${unit.id}/${student.id}/resolve`}
        >
          Submit Resolution
        </Button>
      </Section>

      <Text>A breakdown of the supervisor/reader marks is provided below:</Text>

      <Hr />
      <Heading as="h3">Supervisor Marks:</Heading>
      <Marksheet markingData={supervisorMarking} />
      <Hr />
      <Heading as="h3">Reader Marks:</Heading>
      <Marksheet markingData={readerMarking} />
    </Layout>
  );
}

SupervisorNegotiate1.PreviewProps = {
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
  reader: {
    id: "",
    email: "sam.blankman@uni.ac.uk",
    name: "Sam Blankman",
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
    level: 4,
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
    id: "9ee86629-4e6c-4572-bea5-2c2dc695e6d4",
    title: "Dissertation",
    studentSubmissionDeadline: new Date(),
    markerSubmissionDeadline: new Date(),
    weight: 0,
    isOpen: false,
    components: [],
    flag: { id: "", title: "", description: "" },
    allowedMarkerTypes: [],
  },
  params: {
    group: "socs",
    subGroup: "lvl-4-and-lvl-5-honours",
    instance: "2024-2025",
  },
} satisfies Props;

export default SupervisorNegotiate1;

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
import { format } from "@/lib/utils/date/format";
import {
  fakeCriteria,
  fakeDeadline,
  fakeProject,
  fakeReader,
  fakeReaderSubmission,
  fakeStudent,
  fakeSupervisorSubmission,
  fakeUnit,
} from "@/emails/fake-data";

interface Props {
  project: ProjectDTO;
  reader: ReaderDTO;
  student: StudentDTO;
  unit: UnitOfAssessmentDTO;
  criteria: AssessmentCriterionDTO[];
  supervisorSubmission: MarkingSubmissionDTO;
  readerSubmission: MarkingSubmissionDTO;
  params: InstanceParams;
  deadline: Date;
}

export function SupervisorNegotiate1({
  project,
  reader,
  student,
  unit,
  supervisorSubmission,
  readerSubmission,
  criteria,
  params,
  deadline,
}: Props) {
  const resolutionURL = `${env.FRONTEND_SERVER_URL}/${params.group}/${params.subGroup}/${params.instance}/my-marking/${unit.id}/${student.id}/resolve`;

  return (
    <Layout previewText="Negotiation required">
      <Heading as="h2">{unit.title} Negotiation Required</Heading>
      <Text>
        The grades submitted by the supervisor and reader for the project "
        <i>{project.title}</i>" (student {student.name}, {student.id}){" "}
        <strong>require negotiation</strong> between supervisor and reader.
      </Text>
      <Text>
        <strong>Deadline:</strong> {format(deadline)}
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
          href={resolutionURL}
        >
          Submit Resolution
        </Button>
      </Section>
      <Text>
        If the link above does not work, paste this into your browser:
      </Text>
      <Text>{resolutionURL}</Text>
      <Text>A breakdown of the supervisor/reader marks is provided below:</Text>
      <Hr />
      <Heading as="h3">Supervisor Marks:</Heading>
      <Marksheet criteria={criteria} submission={supervisorSubmission} />
      <Hr />
      <Heading as="h3">Reader Marks:</Heading>
      <Marksheet criteria={criteria} submission={readerSubmission} />
    </Layout>
  );
}

SupervisorNegotiate1.PreviewProps = {
  project: fakeProject,
  reader: fakeReader,
  student: fakeStudent,
  supervisorSubmission: fakeSupervisorSubmission,
  criteria: fakeCriteria,
  readerSubmission: fakeReaderSubmission,
  unit: fakeUnit,
  params: {
    group: "socs",
    subGroup: "lvl-4-and-lvl-5-honours",
    instance: "2024-2025",
  },
  deadline: fakeDeadline,
} satisfies Props;

export default SupervisorNegotiate1;

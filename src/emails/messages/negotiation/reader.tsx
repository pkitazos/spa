import { Marksheet } from "@/emails/components/marksheet";
import {
  fakeCriteria,
  fakeDeadline,
  fakeProject,
  fakeReaderSubmission,
  fakeStudent,
  fakeSupervisor,
  fakeSupervisorSubmission,
  fakeUnit,
} from "@/emails/fake-data";
import { Heading, Hr, Text } from "@react-email/components";

import {
  type AssessmentCriterionDTO,
  type MarkingSubmissionDTO,
  type ProjectDTO,
  type StudentDTO,
  type SupervisorDTO,
  type UnitOfAssessmentDTO,
} from "@/dto";

import { format } from "@/lib/utils/date/format";

import { Layout } from "../../components/layout";

interface Props {
  project: ProjectDTO;
  supervisor: SupervisorDTO;
  student: StudentDTO;
  criteria: AssessmentCriterionDTO[];
  supervisorSubmission: MarkingSubmissionDTO;
  readerSubmission: MarkingSubmissionDTO;
  unit: UnitOfAssessmentDTO;
  deadline: Date;
}

export function ReaderNegotiate1({
  project,
  supervisor,
  student,
  supervisorSubmission,
  readerSubmission,
  criteria,
  unit,
  deadline,
}: Props) {
  return (
    <Layout previewText="Negotiation required">
      <Heading as="h2">{unit.title} Negotiation Required</Heading>
      <Text>
        The grades submitted by the supervisor and reader for the project
        &ldquo;
        <i>{project.title}</i>&rdquo; (student {student.name}, {student.id}){" "}
        <strong>require negotiation</strong> between supervisor and reader.
      </Text>
      <Text>
        <strong>Deadline:</strong> {format(deadline)}
      </Text>
      <Text>
        Please contact the supervisor <strong>{supervisor.name}</strong> (
        {supervisor.email}) and resolve the difference manually offline.
      </Text>
      <Text>
        Once a resolution is reached, <strong>the supervisor</strong> must use
        the link they received in their email regarding this project to upload
        the resolution to SPA.
      </Text>
      <Text>
        If a resolution cannot be found, please contact the project coordinator
        via email (Level 4: Paul.Harvey@glasgow.ac.uk; Level 5:
        Yiannis.Giannakopoulos@glasgow.ac.uk).
      </Text>

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

ReaderNegotiate1.PreviewProps = {
  project: fakeProject,
  student: fakeStudent,
  supervisor: fakeSupervisor,
  supervisorSubmission: fakeSupervisorSubmission,
  readerSubmission: fakeReaderSubmission,
  criteria: fakeCriteria,
  unit: fakeUnit,
  deadline: fakeDeadline,
} satisfies Props;

export default ReaderNegotiate1;

import {
  AssessmentCriterionDTO,
  CriterionScoreDTO,
  MarkingSubmissionDTO,
  ProjectDTO,
  ReaderDTO,
  StudentDTO,
  SupervisorDTO,
  UnitOfAssessmentDTO,
} from "@/dto";
import {
  Column,
  Heading,
  Row,
  Section,
  Text,
  Hr,
} from "@react-email/components";
import { Layout } from "../../components/layout";
import { format } from "@/lib/utils/date/format";
import { Grade } from "@/config/grades";
import { Marksheet } from "@/emails/components/marksheet";
import {
  fakeCriteria,
  fakeDeadline,
  fakeProject,
  fakeReader,
  fakeReaderSubmission,
  fakeStudent,
  fakeSupervisor,
  fakeSupervisorSubmission,
  fakeUnit,
} from "@/emails/fake-data";

interface Props {
  project: ProjectDTO;
  reader: ReaderDTO;
  student: StudentDTO;
  unit: UnitOfAssessmentDTO;
  supervisor: SupervisorDTO;
  deadline: Date;
  criteria: AssessmentCriterionDTO[];
  supervisorSubmission: MarkingSubmissionDTO;
  readerSubmission: MarkingSubmissionDTO;
  negotiationResult?: CriterionScoreDTO;
}

export function CoordinatorModeration({
  project,
  reader,
  student,
  unit,
  supervisor,
  deadline,
  criteria,
  supervisorSubmission,
  readerSubmission,
  negotiationResult,
}: Props) {
  return (
    <Layout previewText="Moderation required">
      <Section>
        <Heading as="h2">Moderation Required</Heading>
        <Row>
          <Column>Student: </Column>
          <Column className="text-right">
            {student.name} ({student.id})
          </Column>
        </Row>

        <Row>
          <Column>Project: </Column>
          <Column className="text-right">{project.title}</Column>
        </Row>

        <Row>
          <Column>Assessment Unit: </Column>
          <Column className="text-right">{unit.title}</Column>
        </Row>

        <Row>
          <Column>Supervisor: </Column>
          <Column className="text-right">
            {supervisor.name} ({supervisor.email})
          </Column>
        </Row>

        <Row>
          <Column>Reader: </Column>
          <Column className="text-right">
            {reader.name} ({reader.email})
          </Column>
        </Row>

        <Row>
          <Column>Supervisor Grade: </Column>
          <Column className="text-right">
            {Grade.toLetter(supervisorSubmission.grade)}
          </Column>
        </Row>

        <Row>
          <Column>Reader Grade: </Column>
          <Column className="text-right">
            {Grade.toLetter(readerSubmission.grade)}
          </Column>
        </Row>

        <Row>
          <Column>Deadline for Moderation: </Column>
          <Column className="text-right">{format(deadline)}</Column>
        </Row>
      </Section>
      <Section>
        <Text>
          A breakdown of the supervisor/reader marks is provided below:
        </Text>

        <Hr />
        <Heading as="h3">Supervisor Marks:</Heading>
        <Marksheet criteria={criteria} submission={supervisorSubmission} />
        <Hr />
        <Heading as="h3">Reader Marks:</Heading>
        <Marksheet criteria={criteria} submission={readerSubmission} />

        {negotiationResult && (
          <>
            <Hr />
            <Heading as="h2">Negotiation Result</Heading>
            <Section>
              <Row className="flex flex-row">
                <span>
                  <i>{Grade.toLetter(negotiationResult.mark)}</i>
                </span>
              </Row>

              <Text>{negotiationResult.justification}</Text>
            </Section>
          </>
        )}
      </Section>
    </Layout>
  );
}

CoordinatorModeration.PreviewProps = {
  project: fakeProject,
  reader: fakeReader,
  readerSubmission: fakeReaderSubmission,
  student: fakeStudent,
  supervisor: fakeSupervisor,
  supervisorSubmission: fakeSupervisorSubmission,
  unit: fakeUnit,
  criteria: fakeCriteria,
  deadline: fakeDeadline,
} satisfies Props;

export default CoordinatorModeration;

import {
  fakeDeadline,
  fakeProject,
  fakeReader,
  fakeStudent,
  fakeSupervisor,
  fakeUnit,
} from "@/emails/fake-data";
import { Column, Heading, Row, Section } from "@react-email/components";

import { Grade } from "@/config/grades";

import {
  type ProjectDTO,
  type ReaderDTO,
  type StudentDTO,
  type SupervisorDTO,
  type UnitOfAssessmentDTO,
} from "@/dto";

import { format } from "@/lib/utils/date/format";

import { Layout } from "../../components/layout";

interface Props {
  project: ProjectDTO;
  supervisor: SupervisorDTO;
  reader: ReaderDTO;
  student: StudentDTO;
  unit: UnitOfAssessmentDTO;
  supervisorGrade: number;
  readerGrade: number;
  deadline: Date;
}

export function CoordinatorNegotiation({
  project,
  reader,
  student,
  unit,
  supervisor,
  supervisorGrade,
  readerGrade,
  deadline,
}: Props) {
  return (
    <Layout previewText="Negotiation required">
      <Section>
        <Heading as="h2">{unit.title} Negotiation Required</Heading>
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
            {Grade.toLetter(supervisorGrade)}
          </Column>
        </Row>

        <Row>
          <Column>Reader Grade: </Column>
          <Column className="text-right">{Grade.toLetter(readerGrade)}</Column>
        </Row>

        <Row>
          <Column>Deadline for Negotiation: </Column>
          <Column className="text-right">{format(deadline)}</Column>
        </Row>
      </Section>
    </Layout>
  );
}

CoordinatorNegotiation.PreviewProps = {
  project: fakeProject,
  student: fakeStudent,
  reader: fakeReader,
  unit: fakeUnit,
  supervisor: fakeSupervisor,
  supervisorGrade: 22,
  readerGrade: 1,
  deadline: fakeDeadline,
} satisfies Props;

export default CoordinatorNegotiation;

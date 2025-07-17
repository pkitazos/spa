import { fakeProject, fakeStudent, fakeUnit } from "@/emails/fake-data";
import { Text, Heading, Row, Column } from "@react-email/components";

import {
  type ProjectDTO,
  type StudentDTO,
  type UnitOfAssessmentDTO,
} from "@/dto";

import { Layout } from "../components/layout";

interface Props {
  project: ProjectDTO;
  student: StudentDTO;
  unit: UnitOfAssessmentDTO;
  grade: string;
}

export function NegotiationResolved({ project, student, unit, grade }: Props) {
  return (
    <Layout previewText="Negotiation Resolved">
      <Heading as="h2">{unit.title} Negotiation Resolved</Heading>
      <Text>
        The marks for {project.title} ({student.name}, {student.id}) have been
        resolved. A summary is provided below:
      </Text>

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

      <Row className="mb-[20px]">
        <Column>Grade: </Column>
        <Column className="text-right">{grade}</Column>
      </Row>
      <Text className="mx-auto text-center italic">
        No further action required
      </Text>
    </Layout>
  );
}

NegotiationResolved.PreviewProps = {
  project: fakeProject,
  student: fakeStudent,
  unit: fakeUnit,
  grade: "B1",
} satisfies Props;

export default NegotiationResolved;

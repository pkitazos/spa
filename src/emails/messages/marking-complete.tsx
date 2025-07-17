import { Column, Row, Heading, Section, Text } from "@react-email/components";

import {
  type ProjectDTO,
  type StudentDTO,
  type UnitOfAssessmentDTO,
} from "@/dto";

import { Layout } from "../components/layout";
import { fakeProject, fakeStudent, fakeUnit } from "../fake-data";

interface Props {
  student: StudentDTO;
  project: ProjectDTO;
  grade: string;
  unit: UnitOfAssessmentDTO;
}

export function MarkingComplete({ unit, student, project, grade }: Props) {
  return (
    <Layout previewText="Auto-resolve successful">
      <Section>
        <Heading as="h2" className="mx-auto text-center">
          {unit.title} Marking Complete:
        </Heading>

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
      </Section>
    </Layout>
  );
}

MarkingComplete.PreviewProps = {
  student: fakeStudent,
  project: fakeProject,
  unit: fakeUnit,
  grade: "H1",
} satisfies Props;

export default MarkingComplete;

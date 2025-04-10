import { Column, Row, Heading, Section, Text } from "@react-email/components";
import { Layout } from "../../components/layout";
import { ProjectDTO, StudentDTO, UnitOfAssessmentDTO } from "@/dto";

interface Props {
  student: StudentDTO;
  project: ProjectDTO;
  grade: string;
  unit: UnitOfAssessmentDTO;
}

export function AutoResolveSuccess({ unit, student, project, grade }: Props) {
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

AutoResolveSuccess.PreviewProps = {
  student: {
    id: "3985764D",
    email: "john.doe@student.gla.ac.ul",
    name: "John Doe",
    joined: true,
    level: 4,
    flags: [],
  },
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
  grade: "H1",
} satisfies Props;

export default AutoResolveSuccess;

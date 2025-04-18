import {
  ProjectDTO,
  ReaderDTO,
  StudentDTO,
  SupervisorDTO,
  UnitOfAssessmentDTO,
} from "@/dto";
import { Column, Heading, Row, Section } from "@react-email/components";
import { Layout } from "../../components/layout";
import { format } from "@/lib/utils/date/format";
import { addWeeks } from "date-fns";
import { Grade } from "@/config/grades";

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
    level: 0,
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
  supervisor: {
    id: "",
    email: "emily.smith@uni.ac.uk",
    name: "Emily Smith",
    joined: false,
    allocationTarget: 0,
    allocationLowerBound: 0,
    allocationUpperBound: 0,
  },
  supervisorGrade: 22,
  readerGrade: 1,
  deadline: addWeeks(new Date(), 1),
} satisfies Props;

export default CoordinatorNegotiation;

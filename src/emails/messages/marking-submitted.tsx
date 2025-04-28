import {
  AssessmentCriterionDTO,
  MarkingSubmissionDTO,
  ProjectDTO,
  StudentDTO,
  UnitOfAssessmentDTO,
  UserDTO,
} from "@/dto";
import { Text, Heading } from "@react-email/components";
import { Layout } from "../components/layout";
import { Marksheet } from "@/emails/components/marksheet";
import {
  fakeCriteria,
  fakeProject,
  fakeStudent,
  fakeSupervisor,
  fakeSupervisorSubmission,
  fakeUnit,
} from "@/emails/fake-data";

interface Props {
  project: ProjectDTO;
  student: StudentDTO;
  unit: UnitOfAssessmentDTO;
  criteria: AssessmentCriterionDTO[];
  submission: MarkingSubmissionDTO;
  marker: UserDTO;
}

export function MarkingSubmitted({
  project,
  student,
  unit,
  submission,
  criteria,
  marker,
}: Props) {
  return (
    <Layout previewText="Marking Submitted">
      <Heading as="h2">{unit.title} Marking Submitted</Heading>
      <Text>
        {marker.name}, the marks for {project.title} ({student.name},{" "}
        {student.id}) were submitted successfully. A summary is provided below:
      </Text>
      <Marksheet criteria={criteria} submission={submission} />
    </Layout>
  );
}

MarkingSubmitted.PreviewProps = {
  project: fakeProject,
  student: fakeStudent,
  criteria: fakeCriteria,
  unit: fakeUnit,
  submission: fakeSupervisorSubmission,
  marker: fakeSupervisor,
} satisfies Props;

export default MarkingSubmitted;

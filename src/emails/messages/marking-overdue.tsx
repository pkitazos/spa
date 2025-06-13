import { Button, Heading, Section, Text } from "@react-email/components";
import { Layout } from "../components/layout";
import { ProjectDTO, StudentDTO, UnitOfAssessmentDTO, UserDTO } from "@/dto";
import {
  fakeParams,
  fakeProject,
  fakeStudent,
  fakeSupervisor,
  fakeUnit,
} from "../fake-data";
import { env } from "@/env";
import { InstanceParams } from "@/lib/validations/params";

interface Props {
  student: StudentDTO;
  project: ProjectDTO;
  unit: UnitOfAssessmentDTO;
  marker: UserDTO;
  params: InstanceParams;
}

export function MarkingOverdue({
  unit,
  student,
  project,
  marker,
  params,
}: Props) {
  const markingURL = `${env.FRONTEND_SERVER_URL}/${params.group}/${params.subGroup}/${params.instance}/my-marking/`;

  return (
    <Layout previewText="Marking Overdue">
      <Section>
        <Heading as="h2" className="mx-auto text-center">
          {unit.title} Marking Overdue:
        </Heading>

        <Text>
          {marker.name}, your grading for project {project.title} (
          {student.name}, {student.id}) is <strong>overdue</strong>. Please
          submit this as soon as possible via the online platform with the
          following link:
        </Text>
        <Section className="mb-[32px] mt-[32px] text-center">
          <Button
            className="rounded bg-[#000000] px-5 py-3 text-center text-[12px] font-semibold text-white no-underline"
            href={markingURL}
          >
            Submit Resolution
          </Button>
        </Section>
        <Text>
          If there is some issue, please contact the coordinator: Paul Harvey
          (Paul.Harvey@glasgow.ac.uk).
        </Text>
      </Section>
    </Layout>
  );
}

MarkingOverdue.PreviewProps = {
  student: fakeStudent,
  project: fakeProject,
  unit: fakeUnit,
  marker: fakeSupervisor,
  params: fakeParams,
} satisfies Props;

export default MarkingOverdue;

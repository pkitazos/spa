import { Button, Heading, Section, Text } from "@react-email/components";
import { Layout } from "../../components/layout";
import {
  ProjectDTO,
  StudentDTO,
  SupervisorDTO,
  UnitOfAssessmentDTO,
} from "@/dto";
import {
  fakeParams,
  fakeProject,
  fakeStudent,
  fakeSupervisor,
  fakeUnit,
} from "../../fake-data";
import { env } from "@/env";
import { InstanceParams } from "@/lib/validations/params";

interface Props {
  student: StudentDTO;
  project: ProjectDTO;
  unit: UnitOfAssessmentDTO;
  supervisor: SupervisorDTO;
  params: InstanceParams;
}

export function SupervisorNegotiationOverdue({
  unit,
  student,
  project,
  supervisor,
  params,
}: Props) {
  const resolutionURL = `${env.FRONTEND_SERVER_URL}/${params.group}/${params.subGroup}/${params.instance}/my-marking/${unit.id}/${student.id}/resolve`;

  return (
    <Layout previewText="Marking Negotiation Overdue">
      <Section>
        <Heading as="h2" className="mx-auto text-center">
          Negotiation Overdue:
        </Heading>
        <Text>
          {supervisor.name}, the negotiation for project {project.title} (
          {student.name}, {student.id}) is overdue. Please negotiate with the
          reader and submit the negotiated grade using the following link:
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
          If there is some issue, please contact the coordinator: Paul Harvey
          (Paul.Harvey@glasgow.ac.uk).
        </Text>
      </Section>
    </Layout>
  );
}

SupervisorNegotiationOverdue.PreviewProps = {
  student: fakeStudent,
  project: fakeProject,
  unit: fakeUnit,
  supervisor: fakeSupervisor,
  params: fakeParams,
} satisfies Props;

export default SupervisorNegotiationOverdue;

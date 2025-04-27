import { Heading, Section, Text } from "@react-email/components";
import { Layout } from "../../components/layout";
import { ProjectDTO, ReaderDTO, StudentDTO } from "@/dto";
import { fakeProject, fakeReader, fakeStudent } from "../../fake-data";

interface Props {
  student: StudentDTO;
  project: ProjectDTO;
  reader: ReaderDTO;
}

export function ReaderNegotiationOverdue({ student, project, reader }: Props) {
  return (
    <Layout previewText="Auto-resolve successful">
      <Section>
        <Heading as="h2" className="mx-auto text-center">
          Negotiation Overdue:
        </Heading>
        <Text>
          {reader.name}, the negotiation for project {project.title} (
          {student.name}, {student.id}) is <strong>overdue</strong>. Please
          negotiate with the supervisor as soon as possible. After which, the
          supervisor should upload the grade using the link they have received
          by email.
        </Text>
        <Text>
          If there is some issue, please contact the coordinator: Paul Harvey
          (Paul.Harvey@glasgow.ac.uk).
        </Text>
      </Section>
    </Layout>
  );
}

ReaderNegotiationOverdue.PreviewProps = {
  student: fakeStudent,
  project: fakeProject,
  reader: fakeReader,
} satisfies Props;

export default ReaderNegotiationOverdue;

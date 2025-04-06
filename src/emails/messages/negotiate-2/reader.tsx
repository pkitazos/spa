import { ProjectDTO, StudentDTO, SupervisorDTO } from "@/dto";
import { Text } from "@react-email/components";
import { Layout } from "../../layout";

interface Props {
  project: ProjectDTO;
  supervisor: SupervisorDTO;
  student: StudentDTO;
}

export function ReaderNegotiate2({ project, supervisor, student }: Props) {
  return (
    <Layout previewText="Negotiation2 required">
      <Text>
        The grades submitted by you and the supervisor for the project "
        <i>{project.title}</i>" (student {student.name}, {student.id}){" "}
        <strong>cannot be resolved automatically</strong>.
      </Text>
      <Text>
        Please contact <strong>{supervisor.name}</strong> ({supervisor.email})
        and resolve the difference manually.
      </Text>
      <Text>
        Once a resolution is decided on, the supervisor should submit it through
        the resolution portal.
      </Text>
    </Layout>
  );
}

ReaderNegotiate2.PreviewProps = {
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
  supervisor: {
    id: "",
    email: "emily.smith@uni.ac.uk",
    name: "Emily Smith",
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
} satisfies Props;

export default ReaderNegotiate2;

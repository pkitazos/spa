import { ProjectDTO, ReaderDTO, StudentDTO } from "@/dto";
import { Text } from "@react-email/components";
import { Layout } from "../../components/layout";

interface Props {
  project: ProjectDTO;
  reader: ReaderDTO;
  student: StudentDTO;
}

export function CoordinatorModeration({ project, reader, student }: Props) {
  return (
    <Layout previewText="Negotiation2 required">
      <Text>
        The grades submitted by you and the reader for the project "
        <i>{project.title}</i>" (student {student.name}, {student.id}){" "}
        <strong>cannot be resolved automatically</strong> and require
        moderation.
      </Text>

      <Text>You are being contacted about this as the coordinator.</Text>
    </Layout>
  );
}

CoordinatorModeration.PreviewProps = {
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
} satisfies Props;

export default CoordinatorModeration;

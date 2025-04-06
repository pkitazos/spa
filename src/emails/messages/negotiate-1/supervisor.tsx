import { ProjectDTO, ReaderDTO, StudentDTO, SupervisorDTO } from "@/dto";
import { Button, Section, Text } from "@react-email/components";
import { Layout } from "../layout";

interface Props {
  project: ProjectDTO;
  reader: ReaderDTO;
  supervisor: SupervisorDTO;
  student: StudentDTO;
}

export function SupervisorNegotiate1({
  project,
  reader,
  supervisor,
  student,
}: Props) {
  return (
    <Layout previewText="Negotiation required">
      <Text>
        The grades submitted by you and the reader for the project "
        <i>{project.title}</i>" (student {student.name}, {student.id}){" "}
        <strong>cannot be resolved automatically</strong>.
      </Text>
      <Text>
        Please contact <strong>{reader.name}</strong> ({reader.email}) and
        resolve the difference manually. Once you have done this:
      </Text>
      <Text>
        1. If you are able to negotiate a new grade, please submit it at the
        link below
      </Text>
      <Text>
        2. In the case where you cannot agree on a grade, please register that
        also on the same page; the project coordinators will be contacted
        automatically.
      </Text>

      <Section className="mb-[32px] mt-[32px] text-center">
        <Button
          className="rounded bg-[#000000] px-5 py-3 text-center text-[12px] font-semibold text-white no-underline"
          href="http://localhost:3000/"
        >
          Submit Resolution
        </Button>
      </Section>
    </Layout>
  );
}

SupervisorNegotiate1.PreviewProps = {
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
  supervisor: {
    id: "",
    email: "",
    name: "",
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

export default SupervisorNegotiate1;

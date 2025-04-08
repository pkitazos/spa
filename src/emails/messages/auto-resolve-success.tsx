import { Text } from "@react-email/components";
import { Layout } from "../layout";
import { StudentDTO } from "@/dto";

interface Props {
  student: StudentDTO;
  grade: string;
}

export function AutoResolveSuccess({ student, grade }: Props) {
  return (
    <Layout previewText="Auto-resolve successful">
      <Text>Auto-resolve was successful for {student.name}.</Text>
      <Text>
        Final grade: <strong>{grade}</strong>
      </Text>
    </Layout>
  );
}

AutoResolveSuccess.PreviewProps = {
  student: {
    id: "xxxxx",
    email: "john.doe@student.gla.ac.ul",
    name: "John Doe",
    joined: true,
    level: 4,
    flags: [],
  },
  grade: "H1",
} satisfies Props;

export default AutoResolveSuccess;

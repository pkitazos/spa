import { Row, Text } from "@react-email/components";
import { Layout } from "./layout";
import { StudentDTO } from "@/dto";

interface Props {
  student: StudentDTO;
  grade: string;
}

export function AutoResolveSuccess({ student, grade }: Props) {
  return (
    <Layout previewText="Auto-resolve successful">
      <Row>
        <Text>Auto-resolve was successful for {student.name}.</Text>
        <Text>
          Final grade:{""}
          <strong>{grade}</strong>
        </Text>
      </Row>
    </Layout>
  );
}

AutoResolveSuccess.PreviewProps = {
  student: {
    id: "xxxxx",
    email: "xxx@student.gla.ac.ul",
    name: "John Doe",
    joined: true,
    level: 4,
    flags: [],
  },
  grade: "H1",
} satisfies Props;

export default AutoResolveSuccess;

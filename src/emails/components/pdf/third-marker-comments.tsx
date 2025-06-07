import { Text, Heading, Row, Section } from "@react-email/components";

export function ThirdMarkerComments({ comments }: { comments: string }) {
  return (
    <Section>
      <Row className="flex flex-row">
        <Heading as="h5" className="mb-0 inline-block">
          Comments:
        </Heading>
      </Row>
      <Text>{comments}</Text>
    </Section>
  );
}

// TODO kill this file, replace with other stuff.
import { Heading, Section, Text } from "@react-email/components";

import { Layout } from "../components/layout";

export function MarkingOverdueGeneric() {
  return (
    <Layout previewText="Marking Overdue">
      <Section>
        <Heading as="h2" className="mx-auto text-center">
          Negotiation Overdue:
        </Heading>
        <Text>
          This is a reminder that you have an outstanding project negotiation to
          resolve.
        </Text>
        <Text>
          Once resolved, the supervisor should upload the resolution via the
          project marking system using the link that they received in their
          email requesting negotiation.
        </Text>
        <Text>
          If there is some issue, please contact the coordinator: Paul Harvey
          (Paul.Harvey@glasgow.ac.uk).
        </Text>
      </Section>
    </Layout>
  );
}

export default MarkingOverdueGeneric;

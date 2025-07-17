// TODO kill this file, replace with other stuff.
import { env } from "@/env";
import { Button, Heading, Section, Text } from "@react-email/components";

import { type InstanceParams } from "@/lib/validations/params";

import { Layout } from "../components/layout";
import { fakeParams } from "../fake-data";

interface Props {
  params: InstanceParams;
}

export function MarkingOverdueGeneric({ params }: Props) {
  const markingURL = `${env.FRONTEND_SERVER_URL}/${params.group}/${params.subGroup}/${params.instance}/my-marking/`;

  return (
    <Layout previewText="Marking Overdue">
      <Section>
        <Heading as="h2" className="mx-auto text-center">
          Marking Overdue:
        </Heading>

        <Text>
          This is a reminder that the marking upload deadline for Level 4 & SEYP
          Projects has now <strong>past</strong>. You are receiving this email
          as you have overdue marks. In particular for supervisors, please
          remember that you need to submit the{" "}
          <u>conduct and presentation marks</u>, as well as the dissertation
          marks. As negotiation may also be required for projects, your support
          is appreciated.
        </Text>
        <Section className="mb-[32px] mt-[32px] text-center">
          <Button
            className="rounded bg-[#000000] px-5 py-3 text-center text-[12px] font-semibold text-white no-underline"
            href={markingURL}
          >
            Submit marking
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

MarkingOverdueGeneric.PreviewProps = { params: fakeParams } satisfies Props;

export default MarkingOverdueGeneric;

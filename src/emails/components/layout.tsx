import {
  Heading,
  Img,
  Text,
  Tailwind,
  Row,
  Section,
  Html,
  Column,
  Head,
  Body,
  Preview,
  Container,
  Hr,
} from "@react-email/components";
import { ReactNode } from "react";

export function Layout({
  previewText,
  children,
}: {
  previewText: string;
  children?: ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Preview>{previewText}</Preview>

          <Container className="mx-auto my-[40px] max-w-[465px] rounded border border-solid border-[#eaeaea] p-[20px]">
            <Section>
              <Row>
                <Column>
                  <Img
                    width={150}
                    height={50}
                    src="uofg-logo@spa.dcs.gla.ac.uk"
                    alt="u-of-g logo"
                  />
                </Column>
                <Column>
                  <Heading as="h1">Glasgow SPA</Heading>
                </Column>
                <Column />
              </Row>
            </Section>
            {children}
            <Hr />
            <Section>
              <Text className="text-center italic text-gray-400">
                This email was generated automatically - please do not reply to
                this directly. For technical issue/bug email
                compsci-spa-support@glasgow.ac.uk. For all other project-related
                enquiries, email the coordinators, Level 4:
                Paul.Harvey@glasgow.ac.uk Level 5:
                Yiannis.Giannakopoulos@glasgow.ac.uk
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

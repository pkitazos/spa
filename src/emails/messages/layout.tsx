import {
  Heading,
  Img,
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
                    src={`http://localhost:3000/_next/image?url=%2Fuofg.png&w=640&q=75`}
                    alt="u-of-g logo"
                  />
                </Column>
                <Column>
                  <Heading as="h1">Glasgow AMPS</Heading>
                </Column>
                <Column />
              </Row>
              {children}
            </Section>
            <Hr />
            <Section>
              <Row>This email was generated automatically</Row>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

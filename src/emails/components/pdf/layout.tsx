import {
  Img,
  Tailwind,
  Section,
  Html,
  Head,
  Body,
  Container,
} from "@react-email/components";
import { ReactNode } from "react";

export function PDFLayout({ children }: { children?: ReactNode }) {
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="mx-auto my-auto max-w-[200mm] rounded border-none p-[20px]">
            <Section>
              <Img
                width={150}
                height={50}
                src="uofg-logo@spa.dcs.gla.ac.uk"
                alt="u-of-g logo"
              />
            </Section>
            {children}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

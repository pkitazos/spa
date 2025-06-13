import { Tailwind, Html, Head, Body, Container } from "@react-email/components";
import { ReactNode } from "react";

export function PDFLayout({ children }: { children?: ReactNode }) {
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="mx-auto my-auto max-w-[200mm] rounded border-none p-[20px]">
            {children}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

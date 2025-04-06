import { render } from "@react-email/components";
import nodemailer from "nodemailer";
import { ReactElement } from "react";

const transporter = nodemailer.createTransport(
  {
    host: "",
    port: 465,
    auth: { user: "maddison53@ethereal.email", pass: "jn7jnAPss4f63QBp6D" },
  },
  { from: "amps-support" },
);

export async function sendMail({
  message,
  to,
  subject,
  cc,
}: {
  message: ReactElement;
  subject: string;
  to: string[];
  cc?: string[];
}) {
  transporter.sendMail({
    to,
    cc,
    subject,
    html: await render(message),
    text: await render(message, { plainText: true }),
  });
}

// EXAMPLE USAGE:
// sendMail({
//   message: <AutoResolveSuccess student={undefined} grade="H1" />,
//   subject: "test",
//   to: ["joe.blogs@gmail.com"],
// });

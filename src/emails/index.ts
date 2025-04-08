import { env } from "@/env";
import { render } from "@react-email/components";
import nodemailer from "nodemailer";
import { ReactElement } from "react";

const transporter = nodemailer.createTransport(
  {
    host: env.MAIL_HOST,
    port: env.MAIL_PORT,
    auth: { user: env.MAIL_USER, pass: env.MAIL_PASSWORD },
  },
  { from: env.MAIL_USER },
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

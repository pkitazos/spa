import { env } from "@/env";
import { render } from "@react-email/components";
import nodemailer from "nodemailer";
import { ReactElement } from "react";

const transporter = nodemailer.createTransport(
  {
    host: env.MAIL_HOST,
    port: env.MAIL_PORT,
    auth: env.MAIL_PASSWORD
      ? { user: env.MAIL_USER, pass: env.MAIL_PASSWORD }
      : undefined,
  },
  { from: { address: env.MAIL_USER, name: "SPA Support" } },
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
    attachments: [
      {
        filename: "uofg.png",
        path: "public/uofg.png",
        cid: "uofg-logo@spa.dcs.gla.ac.uk", //same cid value as in the html img src
      },
    ],
  });
}

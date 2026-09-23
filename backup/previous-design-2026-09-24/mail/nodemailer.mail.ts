import nodemailer from "nodemailer";
import type { EmailPort, SendEmailInput } from "@/src/application/ports/email.port";
import { smtpEnv } from "@/src/infrastructure/env";

export function createNodemailerMailer(): EmailPort {
  const config = smtpEnv;
  const transporter = config
    ? nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.SMTP_SECURE,
        auth:
          config.SMTP_USER && config.SMTP_PASS
            ? { user: config.SMTP_USER, pass: config.SMTP_PASS }
            : undefined,
      })
    : null;

  return {
    isConfigured() {
      return transporter !== null;
    },

    async send(input: SendEmailInput): Promise<void> {
      if (!transporter || !config) {
        throw new Error(
          "SMTP is not configured. Add the SMTP_* environment variables.",
        );
      }
      await transporter.sendMail({
        from: config.SMTP_FROM,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      });
    },
  };
}
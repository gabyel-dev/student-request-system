import nodemailer from "nodemailer";
import type { EmailPort, SendEmailInput } from "@/src/application/ports/email.port";
import { smtpDiagnostics, smtpEnv } from "@/src/infrastructure/env";

const LOG_PREFIX = "[SMTP]";

/**
 * Prints the raw failure exactly as the SMTP library produced it. This is
 * deliberately verbose: when mail is the thing that is broken, the useful
 * details are the transport code, the server response, and the stack — not a
 * friendly paraphrase. Credentials are never part of the error object, and the
 * configuration summary only reports whether they are present.
 */
function logRawSmtpError(stage: string, error: unknown): void {
  console.error(`${LOG_PREFIX} ${stage} failed.`);
  console.error(`${LOG_PREFIX} raw error:`, error);

  if (error && typeof error === "object") {
    const details = error as Record<string, unknown>;
    for (const key of [
      "name",
      "message",
      "code",
      "command",
      "response",
      "responseCode",
      "errno",
      "syscall",
      "address",
      "port",
      "stack",
    ]) {
      if (details[key] !== undefined) {
        console.error(`${LOG_PREFIX} ${key}:`, details[key]);
      }
    }
  }
}

export function createNodemailerMailer(): EmailPort {
  const config = smtpEnv;

  if (!config) {
    console.error(
      `${LOG_PREFIX} Mail is disabled because the SMTP configuration is incomplete.`,
    );
    console.error(`${LOG_PREFIX} raw environment:`, smtpDiagnostics);
    console.error(
      `${LOG_PREFIX} required: SMTP_HOST. SMTP_USER and SMTP_PASS must be set together. SMTP_PORT defaults to 465, SMTP_SECURE defaults to true, SMTP_FROM has a fallback.`,
    );
  } else {
    console.info(`${LOG_PREFIX} configuration loaded:`, {
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_SECURE,
      auth: config.SMTP_USER ? `user=${config.SMTP_USER}` : "none",
      from: config.SMTP_FROM,
    });
  }

  const transporter = config
    ? nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.SMTP_SECURE,
        auth:
          config.SMTP_USER && config.SMTP_PASS
            ? { user: config.SMTP_USER, pass: config.SMTP_PASS }
            : undefined,
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 20_000,
        logger: false,
        debug: false,
      })
    : null;

  // Verify once per process. A failed verification is not cached, so a later
  // send retries and logs the fresh error instead of replaying a stale one.
  let verification: Promise<void> | null = null;
  function verifyConnection(): Promise<void> {
    if (!transporter) {
      return Promise.reject(
        new Error(
          "SMTP is not configured. Add the SMTP_* environment variables.",
        ),
      );
    }
    if (!verification) {
      verification = transporter.verify().then(
        () => {
          console.info(`${LOG_PREFIX} connection verified.`);
        },
        (error) => {
          verification = null;
          throw error;
        },
      );
    }
    return verification;
  }

  return {
    isConfigured() {
      return transporter !== null;
    },

    async send(input: SendEmailInput): Promise<void> {
      if (!transporter || !config) {
        const error = new Error(
          "SMTP is not configured. Add the SMTP_* environment variables.",
        );
        console.error(`${LOG_PREFIX} raw environment:`, smtpDiagnostics);
        logRawSmtpError("Send", error);
        throw error;
      }

      try {
        await verifyConnection();
        const info = await transporter.sendMail({
          from: config.SMTP_FROM,
          to: input.to,
          subject: input.subject,
          html: input.html,
          text: input.text,
        });
        console.info(
          `${LOG_PREFIX} sent to ${input.to} (messageId=${info.messageId ?? "unknown"}).`,
        );
      } catch (error) {
        logRawSmtpError(`Send to ${input.to}`, error);
        throw error;
      }
    },
  };
}

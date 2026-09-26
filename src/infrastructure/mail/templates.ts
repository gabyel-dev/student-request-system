import type { RequestStatus } from "@/src/domain/request";

const INSTITUTION = "Pateros Technological College";
const BRAND = "itikQ";

function getAppUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  return (fromEnv ?? "http://localhost:3000").replace(/\/+$/, "");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

function toParagraphs(value: string): string {
  const cleaned = escapeHtml(value).replace(/\r/g, "");
  return cleaned
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\n/g, "<br/>"))
    .filter((paragraph) => paragraph.trim())
    .map(
      (paragraph) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.62;color:#3a5149;">${paragraph}</p>`,
    )
    .join("");
}

/**
 * Status pill and label colours for the email templates.
 *
 * Literal hex, because an email has no stylesheet to inherit from and no
 * Tailwind to compile against — but the same four values as the app's
 * `--color-*` tokens, inlined. They are written out rather than imported so a
 * mail client never depends on a class it cannot resolve.
 *
 * Keep these in step with `app/globals.css`. "Processing" was blue here while
 * the site had already moved to emerald, so a student's inbox disagreed with
 * the page they were looking at.
 */
const statusMeta: Record<
  RequestStatus,
  {
    label: string;
    pill: string;
    text: string;
  }
> = {
  pending: {
    label: "Pending review",
    pill: "#fbf3e4",
    text: "#96690f",
  },
  processing: {
    label: "Being processed",
    pill: "#e6f4ee",
    text: "#0d7a5b",
  },
  completed: {
    label: "Completed",
    pill: "#e8f2ed",
    text: "#0b6b4a",
  },
  rejected: {
    label: "Rejected",
    pill: "#fbeeed",
    text: "#a33f39",
  },
};

/**
 * Shared email shell: a soft sage ground, a single rounded white card, and a
 * friendly sender header (duck mascot + brand). The card holds the greeting,
 * content, and one primary action; a short footer sits below it.
 */
function shell(input: {
  title: string;
  name: string;
  subtitle: string;
  body: string;
  cta: string;
  note: string;
}): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(input.title)}</title>
    <style>
      @media only screen and (max-width: 560px) {
        .email-page { padding: 24px 12px !important; }
        .email-card { padding: 24px 20px !important; }
        .email-h1 { font-size: 23px !important; }
        .email-duck { width: 44px !important; height: 44px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background-color:#edf3ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-page" style="background-color:#edf3ef;padding:40px 16px;">
      <tr>
        <td align="center">
          <div style="max-width:600px;width:100%;margin:0 auto;">

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;box-shadow:0 1px 2px rgba(20,45,37,.05),0 16px 40px rgba(20,45,37,.09);">
              <tr>
                <td class="email-card" align="left" style="padding:30px 26px;">

                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="width:54px;vertical-align:middle;">
                        <img class="email-duck" src="${getAppUrl()}/pose_2.png" width="54" height="54" alt="${escapeHtml(BRAND)} mascot" style="display:block;border:0;width:54px;height:54px;object-fit:cover;" />
                      </td>
                      <td style="padding-left:13px;vertical-align:middle;">
                        <span style="display:block;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#506a5d;">${escapeHtml(INSTITUTION)}</span>
                        <span style="display:block;margin-top:2px;font-size:17px;font-weight:800;color:#0d4a33;">${escapeHtml(BRAND)} updates</span>
                      </td>
                    </tr>
                  </table>

                  <h1 class="email-h1" style="margin:28px 0 0;font-size:26px;font-weight:800;letter-spacing:-.02em;line-height:1.24;color:#123b32;">Hello, ${escapeHtml(input.name)}!</h1>
                  <p style="margin:10px 0 0;font-size:15px;line-height:1.62;color:#3a5149;">${input.subtitle}</p>

                  ${input.body}

                  ${input.cta}
                </td>
              </tr>
            </table>

            <div style="padding:22px 8px 0;text-align:center;font-size:12px;line-height:1.7;color:#506a5d;">
              <span>${input.note}</span>
              <span style="display:block;margin-top:2px;">${escapeHtml(BRAND)} &middot; ${escapeHtml(INSTITUTION)} &middot; automated message</span>
            </div>

          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Emerald button, the email&rsquo;s single primary action. */
function ctaBlock(href: string, label: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px;">
      <tr>
        <td style="background:#087a54;">
          <a href="${escapeHtml(href)}" style="display:inline-block;background:#087a54;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 30px;">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>`;
}

/** Soft tinted status pill. The label text carries the meaning, not color. */
function statusPill(label: string, pill: string, text: string): string {
  return `<span style="display:inline-block;background:${pill};color:${text};font-size:11px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;padding:7px 14px;">${escapeHtml(label)}</span>`;
}

function statusCard(
  meta: { label: string; pill: string; text: string },
  documentType: string,
  queueNumber: number | null | undefined,
): string {
  return `
    <div style="margin-top:22px;background:#f3f8f5;padding:20px 22px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="vertical-align:middle;">
            ${statusPill(meta.label, meta.pill, meta.text)}
          </td>
          <td align="right" style="vertical-align:middle;padding-left:12px;">
            <span style="font-size:14px;font-weight:800;color:#123b32;">${escapeHtml(documentType)}</span>
          </td>
        </tr>
      </table>
      ${queueNumber ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;padding-top:14px;border-top:1px solid #dfeae3;">
        <tr>
          <td style="width:38px;vertical-align:middle;">
            <span style="display:block;width:34px;height:34px;background:#e0efe7;color:#087a54;font-size:15px;font-weight:800;line-height:34px;text-align:center;">#</span>
          </td>
          <td style="vertical-align:middle;padding-left:12px;">
            <span style="display:block;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#506a5d;">Queue number</span>
            <span style="display:block;margin-top:2px;font-size:20px;font-weight:700;line-height:1.1;color:#123b32;font-family:'SFMono-Regular',ui-monospace,Menlo,Consolas,monospace;">${escapeHtml(String(queueNumber))}</span>
          </td>
        </tr>
      </table>` : ""}
    </div>`;
}

function notesBox(notes: string | null | undefined): string {
  if (!notes) return "";
  return `
    <div style="margin-top:14px;background:#fdf3e2;padding:16px 20px;">
      <strong style="display:block;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#8a6d1f;">Note from the office</strong>
      <span style="display:block;margin-top:6px;font-size:14px;line-height:1.6;color:#6b5315;">${escapeHtml(notes)}</span>
    </div>`;
}

export interface RequestStatusEmailInput {
  studentName: string;
  documentType: string;
  queueNumber?: number | null;
  status: RequestStatus;
  notes?: string | null;
}

export function requestStatusEmail(input: RequestStatusEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const meta = statusMeta[input.status];
  const firstName = getFirstName(input.studentName);

  const subtitle: Record<RequestStatus, string> = {
    completed: `Your <strong>${escapeHtml(input.documentType)}</strong> is ready. Stop by the school to make your payment and claim your document.`,
    rejected: `Your <strong>${escapeHtml(input.documentType)}</strong> request couldn&rsquo;t be approved. If you still need this document, you can submit a new request anytime.`,
    processing: `Your <strong>${escapeHtml(input.documentType)}</strong> request is being processed. We&rsquo;ll email you as soon as it&rsquo;s ready to claim.`,
    pending: `We got your <strong>${escapeHtml(input.documentType)}</strong> request. It&rsquo;s in the queue and will be reviewed soon.`,
  };

  const completedNote =
    input.status === "completed"
      ? `<p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:#506a5d;">Bring a valid ID when you visit. For payment details, contact the registrar&rsquo;s office during office hours.</p>`
      : "";

  const cta =
    input.status === "completed"
      ? ctaBlock(getAppUrl() + "/dashboard", "Go to dashboard")
      : input.status === "rejected"
        ? ctaBlock(getAppUrl() + "/request", "Start a new request")
        : ctaBlock(getAppUrl() + "/dashboard", "Track my request");

  return {
    subject: `[${meta.label.toUpperCase()}] ${input.documentType} request`,
    html: shell({
      title: `${meta.label} - ${input.documentType} request`,
      name: firstName,
      subtitle: subtitle[input.status],
      body: `
        ${statusCard(meta, input.documentType, input.queueNumber)}
        ${notesBox(input.notes)}
        ${completedNote}`,
      cta,
      note: `Open your ${escapeHtml(BRAND)} dashboard to review the details of this request.`,
    }),
    text: `[${meta.label.toUpperCase()}] ${input.documentType} request\n\nHello ${input.studentName},\n\n${subtitle[input.status].replace(/<[^>]+>/g, "")}\n\nStatus: ${meta.label}\nQueue number: ${input.queueNumber ?? "—"}${input.notes ? `\nNote from the office: ${input.notes}` : ""}\n\nOpen your itikQ dashboard for the details.`,
  };
}

export interface SectionBroadcastEmailInput {
  recipientName: string;
  section: string;
  message: string;
  senderName: string;
  institution?: string;
}

export function sectionBroadcastEmail(input: SectionBroadcastEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = getFirstName(input.recipientName);

  return {
    subject: `Announcement for section ${input.section}`,
    html: shell({
      title: `Announcement for section ${input.section}`,
      name: firstName,
      subtitle: `<strong>${escapeHtml(input.senderName)}</strong> posted an announcement for <strong>${escapeHtml(input.section)}</strong>.`,
      body: `
        <div style="margin-top:22px;background:#f3f8f5;padding:22px 24px;">
          <span style="display:inline-block;background:#e1f2e9;color:#0c6d4b;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:7px 14px;">Section ${escapeHtml(input.section)}</span>
          <div style="margin-top:16px;">
            ${toParagraphs(input.message)}
          </div>
          <div style="margin-top:16px;padding-top:16px;border-top:1px solid #dfeae3;">
            <span style="display:block;font-size:13px;font-weight:700;color:#123b32;">&mdash; ${escapeHtml(input.senderName)}</span>
            <span style="display:block;margin-top:2px;font-size:12px;color:#506a5d;">${escapeHtml(input.institution ?? INSTITUTION)}</span>
          </div>
        </div>`,
      cta: ctaBlock(getAppUrl() + "/dashboard", "Open my dashboard"),
      note: `You receive announcements sent to section ${escapeHtml(input.section)}.`,
    }),
    text: `Announcement for section ${input.section}\n\nHello ${input.recipientName},\n\n${input.message}\n\n— ${input.senderName}, ${input.institution ?? INSTITUTION}\n\nOpen your itikQ dashboard for the details.`,
  };
}
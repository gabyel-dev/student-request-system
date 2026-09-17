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
    .map((paragraph) => `<p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#52706a;">${paragraph}</p>`)
    .join("");
}

const statusMeta: Record<
  RequestStatus,
  {
    label: string;
    width: number;
    pill: string;
    from: string;
    to: string;
    text: string;
  }
> = {
  pending: {
    label: "Pending review",
    width: 25,
    pill: "#b07b17",
    from: "#c9922b",
    to: "#b07b17",
    text: "#8a5e10",
  },
  processing: {
    label: "Being processed",
    width: 65,
    pill: "#1f6fb2",
    from: "#4fa3e3",
    to: "#1f6fb2",
    text: "#16578f",
  },
  completed: {
    label: "Completed",
    width: 100,
    pill: "#087a54",
    from: "#28b48a",
    to: "#087a54",
    text: "#0a6a49",
  },
  rejected: {
    label: "Rejected",
    width: 100,
    pill: "#b0423c",
    from: "#c96a63",
    to: "#b0423c",
    text: "#8f3029",
  },
};

/**
 * Shared email shell that mirrors the desktop login page: a deep green campus
 * backdrop with soft mint blobs, the white logo pinned top-left, and a rounded
 * frosted card holding the school seal, greeting, content and a pill button.
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
  </head>
  <body style="margin:0;padding:0;background-color:#09201e;font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#09201e;padding:30px 18px 24px;background-image:url('${getAppUrl()}/bg.webp');background-position:center top;background-size:cover;">
      <tr>
        <td align="center">
          <div style="max-width:600px;width:100%;margin:0 auto;">

            <div style="padding:0 6px 22px;">
              <img src="${getAppUrl()}/_logo_white.png" alt="${escapeHtml(BRAND)}" width="200" style="display:block;border:0;width:200px;height:auto;" />
            </div>

            <div style="position:relative;">
              <div style="position:absolute;left:-46px;top:52px;width:150px;height:150px;border-radius:999px;background:#9cdec0;opacity:.55;"></div>
              <div style="position:absolute;right:-40px;bottom:-34px;width:180px;height:180px;border-radius:999px;background:#8ed4b5;opacity:.5;"></div>

              <div style="position:relative;border:1px solid rgba(255,255,255,.72);border-radius:30px;background:rgba(245,255,250,.94);box-shadow:18px 24px 60px rgba(5,45,34,.3);padding:32px 30px;">

                <img src="${getAppUrl()}/logo.png" alt="${escapeHtml(INSTITUTION)} seal" width="78" style="display:block;border:0;width:78px;height:78px;border-radius:50%;" />

                <h1 style="margin:18px 0 6px;font-size:28px;font-weight:700;letter-spacing:-.03em;line-height:1.15;color:#123b32;">
                  Hello, ${escapeHtml(input.name)}.
                </h1>
                <p style="margin:0 0 22px;font-size:14px;line-height:1.7;color:#52706a;">${input.subtitle}</p>

                ${input.body}

                ${input.cta}

                <p style="margin:18px 0 0;font-size:11px;line-height:1.6;color:#5c7771;">${input.note}</p>
              </div>
            </div>

            <div style="padding:22px 10px 0;text-align:center;font-size:12px;line-height:1.7;color:rgba(255,255,255,.92);">
              <span style="color:#c9f3dd;font-weight:700;">${escapeHtml(BRAND)}</span> &middot; ${escapeHtml(INSTITUTION)}<br/>
              This is an automated message. If it wasn&rsquo;t meant for you, please disregard it.
            </div>

          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Pill button styled after the login page's frosted white sign-in button.
 */
function ctaBlock(href: string, label: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 0;">
      <tr>
        <td>
          <a href="${escapeHtml(href)}" style="display:inline-block;background:rgba(255,255,255,.68);border:1px solid rgba(255,255,255,.85);border-radius:999px;color:#24574a;font-size:14px;font-weight:700;text-decoration:none;padding:13px 28px;box-shadow:0 8px 20px rgba(30,105,78,.18);">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>`;
}

function statusPill(label: string, tone: string): string {
  return `<span style="display:inline-block;background:${tone};color:#ffffff;font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;border-radius:999px;padding:6px 12px;">${escapeHtml(label)}</span>`;
}

function queueChip(queueNumber: number | null | undefined): string {
  if (!queueNumber) return "";
  return `
    <div style="margin-top:12px;display:flex;align-items:center;gap:12px;background:rgba(233,246,240,.7);border:1px solid rgba(200,225,210,.8);border-radius:16px;padding:12px 16px;">
      <div style="width:38px;height:38px;border-radius:14px;background:linear-gradient(to bottom right,#e3f5ee,#cdeeda);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:#087a54;">#</div>
      <div>
        <div style="font-size:10px;color:#5c7771;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Queue number</div>
        <div style="font-size:20px;font-weight:700;color:#123b32;font-family:monospace;margin-top:2px;">${escapeHtml(String(queueNumber))}</div>
      </div>
    </div>`;
}

function notesBox(notes: string | null | undefined): string {
  if (!notes) return "";
  return `
    <div style="margin-top:12px;background:#fdf6e3;border:1px solid #f0e0ae;border-radius:16px;padding:13px 16px;font-size:13px;color:#7a5c13;line-height:1.6;">
      <strong style="display:block;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#8a6d1f;margin-bottom:4px;">Note from the office</strong>
      ${escapeHtml(notes)}
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
    completed: `Great news &mdash; your <strong>${escapeHtml(input.documentType)}</strong> is ready. You can now go to school to make your payment and claim your document.`,
    rejected: `Your <strong>${escapeHtml(input.documentType)}</strong> request was reviewed and couldn&rsquo;t be approved. If you still need this document, you can submit a new request anytime.`,
    processing: `Your <strong>${escapeHtml(input.documentType)}</strong> request is now being processed. We&rsquo;ll email you the moment it&rsquo;s ready to claim.`,
    pending: `We received your <strong>${escapeHtml(input.documentType)}</strong> request. It&rsquo;s in the queue and will be reviewed soon.`,
  };

  const completedNote =
    input.status === "completed"
      ? `<p style="margin:10px 0 0;font-size:12px;line-height:1.6;color:#5c7771;">Bring a valid ID when you visit. For payment details, contact the registrar&rsquo;s office during office hours.</p>`
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
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          ${statusPill(meta.label, meta.pill)}
          <span style="font-size:13px;font-weight:700;color:#24574a;">${escapeHtml(input.documentType)}</span>
        </div>

        <div style="margin-top:14px;background:rgba(255,255,255,.6);border:1px solid rgba(200,225,210,.7);border-radius:16px;padding:16px 18px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
            <span style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${meta.text};">${meta.label}</span>
            <span style="font-size:11px;color:#5c7771;font-family:monospace;">${input.status === "rejected" ? "Closed" : `${meta.width}%`}</span>
          </div>
          <div style="margin-top:9px;background:#e3efe9;border-radius:999px;height:8px;">
            <div style="width:${meta.width}%;height:8px;border-radius:999px;background:linear-gradient(90deg,${meta.from},${meta.to});"></div>
          </div>
        </div>

        ${queueChip(input.queueNumber)}
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
      subtitle: `Here is a new announcement for <strong>${escapeHtml(input.section)}</strong> from ${escapeHtml(input.senderName)}.`,
      body: `
        <span style="display:inline-block;background:#0d4a33;color:#e5faed;font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;border-radius:999px;padding:6px 12px;">${escapeHtml(input.section)}</span>

        <div style="margin-top:16px;background:rgba(255,255,255,.6);border:1px solid rgba(200,225,210,.7);border-radius:16px;padding:18px 20px;">
          ${toParagraphs(input.message)}
          <p style="margin:14px 0 0;padding-top:14px;border-top:1px solid rgba(200,225,210,.8);font-size:13px;line-height:1.6;color:#5c7771;">
            &mdash; ${escapeHtml(input.senderName)}<br/>${escapeHtml(input.institution ?? INSTITUTION)}
          </p>
        </div>`,
      cta: ctaBlock(getAppUrl() + "/dashboard", "Open my dashboard"),
      note: `You receive announcements sent to section ${escapeHtml(input.section)}.`,
    }),
    text: `Announcement for section ${input.section}\n\nHello ${input.recipientName},\n\n${input.message}\n\n— ${input.senderName}, ${input.institution ?? INSTITUTION}\n\nOpen your itikQ dashboard for the details.`,
  };
}
import type {
  AssistantChatMessage,
  AssistantContext,
  AssistantRequestSummary,
} from "@/src/domain/assistant";
import { faqCategories, type Faq } from "@/src/domain/faq";
import { services } from "@/src/domain/services";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const KEY_ANSWERS = `Q: How do I request a document?
A: From your dashboard, choose New request, pick the document you need, confirm your details, and submit. Your queue number appears right away.

Q: Where can I find my queue number?
A: It is on the ticket at the top of your dashboard and inside every request under Recent activity.

Q: What do the statuses mean?
A: Pending means your request is in the queue. Processing means the registrar is working on it. Completed means the document is ready — check the notes for pickup. Rejected means it could not be processed; read the notes, fix the issue, and file a new request.

Q: How many requests can I file per day?
A: Five per day. Your dashboard shows how many you have left.

Q: Can I edit or cancel a request?
A: Yes while it is still Pending. Once it is Processing, contact the registrar to change it.

Q: How long until my request is done?
A: It depends on the document and the current queue. Check the live status on your dashboard.

Q: What do COR, TOR, and COG mean?
A: COR is Certificate of Registration, TOR is Transcript of Records, and COG is Certificate of Grades. They are three different documents.`;

const KEY_QUESTIONS = new Set([
  "How do I request a document?",
  "Where can I find my queue number?",
  "What does Pending mean?",
  "What does Processing mean?",
  "What does Completed mean?",
  "What does Rejected mean?",
  "How many requests can I file per day?",
  "What happens when I use all five?",
  "Can I edit or cancel a request I already filed?",
  "How long until my request is done?",
]);

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "how",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "can",
  "could",
  "should",
  "would",
  "does",
  "did",
  "is",
  "are",
  "was",
  "were",
  "my",
  "your",
  "i",
  "me",
  "a",
  "an",
  "of",
  "to",
  "in",
  "on",
  "do",
  "it",
  "this",
  "that",
  "with",
  "about",
  "request",
  "requests",
  "document",
  "documents",
]);

function keywords(text: string): string[] {
  const words = text.toLowerCase().match(/[a-z0-9]{3,}/g) ?? [];
  return Array.from(new Set(words)).filter((word) => !STOPWORDS.has(word));
}

function selectRelevantFaqs(query: string): Faq[] {
  const words = keywords(query);
  if (!words.length) return [];

  return faqCategories
    .flatMap((category) => category.faqs)
    .filter((faq) => !KEY_QUESTIONS.has(faq.question))
    .map((faq) => {
      const question = faq.question.toLowerCase();
      const answer = faq.answer.toLowerCase();
      const score = words.reduce(
        (total, word) =>
          total +
          (question.includes(word) ? 3 : 0) +
          (answer.includes(word) ? 1 : 0),
        0,
      );
      return { faq, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 1)
    .map((item) => item.faq);
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown date";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(date);
}

function formatRequest(request: AssistantRequestSummary): string {
  const parts = [
    `${request.documentType} — queue #${request.queueNumber}`,
    `status: ${request.status}`,
    `section: ${request.section ?? "unknown"}`,
    `filed: ${formatDate(request.createdAt)}`,
  ];
  if (request.archived) parts.push("archived request");
  if (request.notes) parts.push(`registrar notes: "${request.notes}"`);
  return `- ${parts.join("; ")}`;
}

function abbreviationHint(query: string): string {
  const matches = [
    [/\bcog\b/i, "COG = Certificate of Grades (not Certificate of Registration)"],
    [/\bcor\b/i, "COR = Certificate of Registration"],
    [/\btor\b/i, "TOR = Transcript of Records"],
  ] as const;
  const hint = matches
    .filter(([pattern]) => pattern.test(query))
    .map(([, meaning]) => meaning);
  return hint.length
    ? `\n### ABBREVIATION IN THIS QUESTION\n${hint.join("\n")}`
    : "";
}

function buildSystemPrompt(context: AssistantContext, query: string): string {
  const today = new Intl.DateTimeFormat("en-PH", {
    dateStyle: "full",
    timeZone: "Asia/Manila",
  }).format(new Date(context.serverTime));

  const requests = context.requests.length
    ? context.requests.map(formatRequest).join("\n")
    : "No requests on file.";

  const serviceText = services
    .map(
      (service) =>
        `- ${service.title}${
          service.aliases?.length ? ` (${service.aliases.join(", ")})` : ""
        }`,
    )
    .join("\n");

  const relevant = selectRelevantFaqs(query);
  const extra = relevant.length
    ? `\n### MORE HELP CENTER ANSWERS\n${relevant
        .map((faq) => `Q: ${faq.question}\nA: ${faq.answer}`)
        .join("\n")}`
    : "";

  return `You are the itikQ Assistant for Pateros Technological College (PTC).
You help a signed-in student understand the document-request process and check their own request status.

Today is ${today} (Asia/Manila).
Student: ${context.user.firstName}${context.user.section ? ` — section ${context.user.section}` : ""}.

### STUDENT'S REQUESTS (newest first; this is the source of truth)
${requests}

### ITIKQ KEY ANSWERS
${KEY_ANSWERS}

### DOCUMENT TYPES
${serviceText}${abbreviationHint(query)}
${extra}

### RULES
- Answer only about itikQ, PTC document requests, queue numbers, statuses, the daily request limit, profile setup, or the Registrar's Office.
- Treat document abbreviations exactly: COG means Certificate of Grades, never Certificate of Registration. COR means Certificate of Registration. TOR means Transcript of Records.
- When the student uses an abbreviation, name the full document in your answer so there is no ambiguity.
- Use only the facts and student request data above. Never invent a queue number, status, date, requirement, or policy.
- If a request is not in the list above, say you cannot see it and point to the dashboard. Never guess.
- Do not claim to submit, edit, cancel, approve, or reject a request.
- Never ask for passwords, one-time codes, or another student's information.
- If you are unsure, say so and suggest the Help Center (/dashboard/help) or the Registrar's Office.
- Keep the answer to 1-3 short sentences of plain English. Do not use markdown tables.
`;
}

export function buildChatMessages(
  context: AssistantContext,
  history: AssistantChatMessage[],
): ChatMessage[] {
  const lastUser = [...history].reverse().find((message) => message.role === "user");
  return [
    { role: "system", content: buildSystemPrompt(context, lastUser?.content ?? "") },
    ...history.slice(-4).map((message) => ({
      role: message.role,
      content: message.content.slice(0, 600),
    })),
  ];
}

export type Faq = { question: string; answer: string };

export type FaqCategory = {
  id: string;
  title: string;
  blurb: string;
  faqs: Faq[];
};

export const faqCategories: FaqCategory[] = [
  {
    id: "getting-started",
    title: "Getting started",
    blurb: "What itikQ is and how to set up your profile.",
    faqs: [
      {
        question: "What is itikQ?",
        answer:
          "itikQ is the online request lane for Pateros Technological College. You file document requests here, receive a queue number, and follow each request's status until your document is ready — no need to line up just to submit.",
      },
      {
        question: "How do I complete my student profile?",
        answer:
          "After your first sign-in you'll enter your course code (e.g. BSIT), year level, section code (e.g. H), and student number. Your class section is built from these — BSIT, 3rd year, H becomes “BSIT 3H”. You only do this once.",
      },
      {
        question: "Why am I being asked for my profile again?",
        answer:
          "If any profile field is missing you'll be sent back to complete it before filing requests. Fill in every field and you'll go straight to your dashboard next time.",
      },
    ],
  },
  {
    id: "requests",
    title: "Requests & queue",
    blurb: "Filing, finding, and managing your requests.",
    faqs: [
      {
        question: "How do I request a document?",
        answer:
          "From your dashboard, choose New request, then select Certificate of Registration, Certificate of Grades, Subject Request, or Others. Confirm your details and submit. Subject Request requires notes and 1–4 proof files totaling no more than 20 MB. Your queue number appears right away.",
      },
      {
        question: "Where can I find my queue number?",
        answer:
          "It's printed on the ticket at the top of your dashboard, and inside every request listed under Recent activity.",
      },
      {
        question: "Which requests require proof files?",
        answer:
          "Subject Request requires notes and proof. You can select up to 4 JPG, PNG, WEBP, GIF, or PDF files in one browse; the files may total no more than 20 MB. Proof files can be screenshots.",
      },
      {
        question: "Can I edit or cancel a request I already filed?",
        answer:
          "Yes, while it is still Reviewing: expand the request in Recent activity and use Edit or Delete. After it moves to Processing or Pending payment, it can no longer be edited or deleted by the student.",
      },
      {
        question: "How long until my request is done?",
        answer:
          "It depends on the document and the current queue. Your dashboard always shows the live status, so check back there instead of guessing.",
      },
    ],
  },
  {
    id: "statuses",
    title: "Request statuses",
    blurb: "What each status on your request means.",
    faqs: [
      {
        question: "What does Reviewing mean?",
        answer:
          "The registrar is reviewing your submitted request. It can still be edited or deleted while it remains Reviewing.",
      },
      {
        question: "What does Processing mean?",
        answer:
          "The registrar is preparing your request. The registrar will notify you when you can go to school.",
      },
      {
        question: "What does Pending payment mean?",
        answer:
          "Your [request] is pending. Proceed to the Cashier's office for the payment of the requested document/s within a week. otherwise your request will be rejected.",
      },
      {
        question: "What does Claimed mean?",
        answer:
          "The document has already been claimed by the student.",
      },
      {
        question: "What does Rejected (overdue) mean?",
        answer:
          "It is an optional terminal status used when a request is overdue or can no longer be processed. Read the request's notes for details.",
      },
    ],
  },
  {
    id: "daily-limit",
    title: "Daily request limit",
    blurb: "How many requests you can file each day.",
    faqs: [
      {
        question: "How many requests can I file per day?",
        answer:
          "Four. Your dashboard shows how many requests you have left, and the indicator turns amber or red as your allowance runs low.",
      },
      {
        question: "What happens when I use all four?",
        answer:
          "Requesting pauses until the next day. If you need several documents, plan ahead and spread them out.",
      },
    ],
  },
  {
    id: "profile",
    title: "Profile & student ID",
    blurb: "Student numbers, formats, and section codes.",
    faqs: [
      {
        question: "Which student number format should I choose?",
        answer:
          "If your ID looks like 24BSIT-0123 (two digits, four letters, a dash, four digits), choose Standard. If yours was issued in a different format, choose Custom and type it exactly as printed on your ID.",
      },
      {
        question: "Why must my course match my student ID?",
        answer:
          "On standard IDs the four letters in the middle are your course code (BSIT in 24BSIT-0123). Matching it to the course you entered keeps your request tied to the right class record. This check only applies to standard IDs.",
      },
    ],
  },
];

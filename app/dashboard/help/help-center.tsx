"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { IconType } from "react-icons";
import {
  FiArrowRight,
  FiCheckCircle,
  FiChevronDown,
  FiClock,
  FiFileText,
  FiFlag,
  FiInbox,
  FiLayers,
  FiLoader,
  FiMapPin,
  FiRefreshCw,
  FiSearch,
  FiUser,
  FiXCircle,
} from "react-icons/fi";

type Faq = { question: string; answer: string };
type Category = {
  id: string;
  title: string;
  blurb: string;
  icon: IconType;
  faqs: Faq[];
};

const CATEGORIES: Category[] = [
  {
    id: "getting-started",
    title: "Getting started",
    blurb: "What itikQ is and how to set up your profile.",
    icon: FiFlag,
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
    icon: FiFileText,
    faqs: [
      {
        question: "How do I request a document?",
        answer:
          "From your dashboard, choose New request, pick the document you need, confirm your details, and submit. Your queue number appears right away — keep it, it's your place in line.",
      },
      {
        question: "Where can I find my queue number?",
        answer:
          "It's printed on the ticket at the top of your dashboard, and inside every request listed under Recent activity.",
      },
      {
        question: "Can I edit or cancel a request I already filed?",
        answer:
          "Yes, while it's still Pending: expand the request in Recent activity and use Edit or Delete. Once it moves to Processing it's with the registrar — contact them directly if something needs to change.",
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
    icon: FiRefreshCw,
    faqs: [
      {
        question: "What does Pending mean?",
        answer:
          "Your request is in the queue, waiting to be picked up by the registrar. Nothing is wrong — your turn is coming.",
      },
      {
        question: "What does Processing mean?",
        answer: "The registrar is actively working on your request.",
      },
      {
        question: "What does Completed mean?",
        answer:
          "Your document is ready. Check the request's notes for pickup or claiming instructions.",
      },
      {
        question: "What does Rejected mean?",
        answer:
          "Your request couldn't be processed as filed. Read the notes to see why, fix the issue, and file a new request.",
      },
    ],
  },
  {
    id: "daily-limit",
    title: "Daily request limit",
    blurb: "How many requests you can file each day.",
    icon: FiLayers,
    faqs: [
      {
        question: "How many requests can I file per day?",
        answer:
          "Five. Your dashboard shows how many you have left, and the indicator turns amber when you're down to your last two.",
      },
      {
        question: "What happens when I use all five?",
        answer:
          "Requesting pauses until the next day. If you need several documents, plan ahead and spread them out.",
      },
    ],
  },
  {
    id: "profile",
    title: "Profile & student ID",
    blurb: "Student numbers, formats, and section codes.",
    icon: FiUser,
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

const JOURNEY_STEPS = [
  { icon: FiClock, label: "Pending" },
  { icon: FiLoader, label: "Processing" },
  { icon: FiCheckCircle, label: "Completed" },
];

function FaqItem({
  faq,
  open,
  onToggle,
}: {
  faq: Faq;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`rounded-2xl border transition ${
        open ? "border-accent/40 bg-surface" : "border-hairline bg-surface"
      }`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
        <span className="text-[15px] font-semibold text-ink">
          {faq.question}
        </span>
        <FiChevronDown
          aria-hidden="true"
          className={`shrink-0 text-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open ? (
        <p className="px-5 pb-5 text-sm leading-6 text-muted">{faq.answer}</p>
      ) : null}
    </div>
  );
}

export function HelpCenter() {
  const [query, setQuery] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const matches: { category: string; faq: Faq }[] = [];
    for (const category of CATEGORIES) {
      for (const faq of category.faqs) {
        if (
          faq.question.toLowerCase().includes(q) ||
          faq.answer.toLowerCase().includes(q) ||
          category.title.toLowerCase().includes(q)
        ) {
          matches.push({ category: category.title, faq });
        }
      }
    }
    return matches;
  }, [query]);

  const toggle = (key: string) =>
    setOpenKey((current) => (current === key ? null : key));

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="mt-2 text-3xl font-bold tracking-[-0.02em] text-ink sm:text-4xl">
        How can we help?
      </h1>
      <p className="mt-3 max-w-xl text-[15px] leading-7 text-muted">
        Answers about filing requests, queue numbers, statuses, and your student
        profile.
      </p>

      <div className="relative mt-6">
        <FiSearch
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search, e.g. “queue number” or “rejected”"
          aria-label="Search help articles"
          className="min-h-12 w-full rounded-full border border-hairline bg-surface pl-11 pr-4 text-[15px] text-ink outline-none transition placeholder:text-muted focus:border-accent"
        />
      </div>

      {results ? (
        <div className="mt-8">
          <p className="text-sm font-semibold text-ink">
            {results.length} {results.length === 1 ? "result" : "results"} for “
            {query.trim()}”
          </p>
          {results.length > 0 ? (
            <div className="mt-4 space-y-2.5">
              {results.map(({ category, faq }, index) => {
                const key = `search-${index}`;
                return (
                  <div key={key}>
                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                      {category}
                    </p>
                    <FaqItem
                      faq={faq}
                      open={openKey === key}
                      onToggle={() => toggle(key)}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center rounded-3xl border border-dashed border-hairline bg-surface px-6 py-12 text-center">
              <FiInbox aria-hidden="true" className="text-muted" size={28} />
              <p className="mt-3 font-semibold text-ink">No answers found</p>
              <p className="mt-1 max-w-sm text-sm text-muted">
                Try different keywords, or browse the topics below.
              </p>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {CATEGORIES.map((category) => (
              <a
                key={category.id}
                href={`#${category.id}`}
                className="group flex flex-col items-start gap-3 rounded-2xl border border-hairline bg-surface p-4 transition hover:border-accent/40">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent-soft text-accent transition group-hover:bg-accent group-hover:text-white">
                  <category.icon aria-hidden="true" size={17} />
                </span>
                <span className="text-[13px] font-bold leading-5 text-ink">
                  {category.title}
                </span>
              </a>
            ))}
          </div>

          <div className="mt-10 space-y-10">
            {CATEGORIES.map((category) => (
              <section
                key={category.id}
                id={category.id}
                className="scroll-mt-24">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent">
                    <category.icon aria-hidden="true" size={18} />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-ink">
                      {category.title}
                    </h2>
                    <p className="text-[13px] text-muted">{category.blurb}</p>
                  </div>
                </div>

                {category.id === "statuses" ? (
                  <div className="mb-4 mt-4 rounded-2xl border border-hairline bg-sunken p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {JOURNEY_STEPS.map((step, index) => (
                        <span
                          key={step.label}
                          className="flex items-center gap-2">
                          {index > 0 ? (
                            <FiArrowRight
                              aria-hidden="true"
                              className="text-muted"
                              size={14}
                            />
                          ) : null}
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-3 py-1.5 text-[13px] font-semibold text-ink">
                            <step.icon
                              aria-hidden="true"
                              className="text-accent"
                              size={14}
                            />
                            {step.label}
                          </span>
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 flex items-center gap-1.5 text-[13px] text-muted">
                      <FiXCircle aria-hidden="true" size={14} />
                      Rejected sits outside this flow — it means the request
                      needs corrections.
                    </p>
                  </div>
                ) : null}

                <div className="mt-4 space-y-2.5">
                  {category.faqs.map((faq, index) => {
                    const key = `${category.id}-${index}`;
                    return (
                      <FaqItem
                        key={key}
                        faq={faq}
                        open={openKey === key}
                        onToggle={() => toggle(key)}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </>
      )}

      <div className="relative mt-12 overflow-hidden rounded-3xl bg-mesh-deep p-6 text-white sm:p-8">
        <div className="relative">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15">
            <FiMapPin aria-hidden="true" size={18} />
          </span>
          <h2 className="mt-4 text-xl font-bold">Still stuck?</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-white/75">
            Visit the Registrar&apos;s Office at Pateros Technological College.
            Bring your queue number — it lets staff pull up your request
            instantly.
          </p>
          <Link
            href="/dashboard"
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-ink transition hover:bg-white/90">
            Back to dashboard
            <FiArrowRight aria-hidden="true" size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}

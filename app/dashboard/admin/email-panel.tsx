"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  FiAlertCircle,
  FiMail,
  FiSend,
  FiUserCheck,
  FiUserX,
} from "react-icons/fi";
import {
  sendSectionAnnouncement,
  type MailActionState,
} from "@/app/actions/mail";
import { useToast } from "@/app/components/toaster";
import { statusTone } from "../lib/request-utils";
import type { StudentRequest, RequestStatus } from "@/src/domain/request";
import type { User } from "@/src/domain/user";

const initialState: MailActionState = { error: null, success: null };

const ALL_SECTIONS = "__all__";

function buildSectionList(students: User[]): string[] {
  return [
    ...new Set(
      students
        .map((student) => student.section)
        .filter((section): section is string => Boolean(section)),
    ),
  ].sort((a, b) => a.localeCompare(b));
}

export function EmailPanel({
  students,
  requests,
}: {
  students: User[];
  requests: StudentRequest[];
}) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [section, setSection] = useState<string>("");
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const [state, formAction] = useActionState(sendSectionAnnouncement, initialState);

  useEffect(() => {
    if (state.success) {
      toastSuccess(state.success);
      if (messageRef.current) messageRef.current.value = "";
    } else if (state.error) {
      toastError(state.error);
    }
  }, [state, toastSuccess, toastError]);

  const sections = useMemo(() => buildSectionList(students), [students]);

  const profiles = useMemo(() => {
    const perUser = new Map<string, { active: number; completed: number; last: RequestStatus | null }>();
    for (const request of requests) {
      const entry = perUser.get(request.userId) ?? {
        active: 0,
        completed: 0,
        last: null as RequestStatus | null,
      };
      if (request.status === "pending" || request.status === "processing") entry.active += 1;
      if (request.status === "completed") entry.completed += 1;
      entry.last = request.status;
      perUser.set(request.userId, entry);
    }
    return perUser;
  }, [requests]);

  const targeted = useMemo(() => {
    if (!section) return [];
    return students
      .filter((student) =>
        section === ALL_SECTIONS
          ? Boolean(student.section)
          : student.section === section,
      )
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [section, students]);

  const verified = targeted.filter((s) => Boolean(s.section && s.studentNumber));
  const incomplete = targeted.filter((s) => !s.section || !s.studentNumber);

  return (
    <section
      id="email"
      className="dash-glass scroll-mt-24 px-4 py-5 sm:px-8 sm:py-7 lg:rounded-tr-4xl lg:rounded-bl-4xl">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-[-.03em] text-[#123b32]">
            <FiMail className="text-[#087a54]" aria-hidden="true" />
            Email students
          </h2>
          <p className="mt-1 text-xs text-[#5d6f66]">
            Send an announcement to a whole section, or to every verified
            student. Verify each student&rsquo;s status before you send.
          </p>
        </div>
      </div>

      <form
        action={formAction}
        className="mt-4 grid gap-5 rounded-2xl border border-[#dbeadf] bg-white/60 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid min-w-0 content-start gap-4">
          <div>
            <label
              htmlFor="email-section"
              className="mb-1.5 block text-xs font-bold uppercase tracking-[.08em] text-[#14251d]">
              Section
            </label>
            <select
              id="email-section"
              name="section"
              value={section}
              onChange={(event) => setSection(event.target.value)}
              required
              className="w-full border border-[#cfddd5] bg-white px-3.5 py-2.5 text-sm text-[#14251d] outline-none transition-colors focus:border-[#087a54]">
              <option value="" disabled>
                Choose a sectionâ€¦
              </option>
              <option value={ALL_SECTIONS}>
                All verified students
              </option>
              {sections.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="email-subject"
              className="mb-1.5 block text-xs font-bold uppercase tracking-[.08em] text-[#14251d]">
              Subject
            </label>
            <input
              id="email-subject"
              name="subject"
              type="text"
              required
              maxLength={120}
              placeholder="e.g. Ready to claim your document"
              className="w-full border border-[#cfddd5] bg-white px-3.5 py-2.5 text-sm text-[#14251d] outline-none transition-colors focus:border-[#087a54]"
            />
          </div>

          <div>
            <label
              htmlFor="email-message"
              className="mb-1.5 block text-xs font-bold uppercase tracking-[.08em] text-[#14251d]">
              Message
            </label>
            <textarea
              id="email-message"
              name="message"
              ref={messageRef}
              required
              rows={7}
              maxLength={4000}
              placeholder="Write the announcement the students will receiveâ€¦"
              className="w-full resize-y border border-[#cfddd5] bg-white px-3.5 py-2.5 text-sm leading-relaxed text-[#14251d] outline-none transition-colors focus:border-[#087a54]"
            />
          </div>

          <SendButton />
        </div>

        <aside className="min-w-0 rounded-lg border border-[#e7efea] bg-[#f7fbf9] p-4">
          <div className="flex items-center justify-between gap-2">
            <strong className="text-xs font-bold uppercase tracking-[.08em] text-[#2c4036]">
              Recipients
            </strong>
            <span className="font-mono text-xs tabular-nums text-[#087a54]">
              {verified.length} ready
            </span>
          </div>

          {section ? (
            targeted.length ? (
              <>
                <ul className="mt-3 grid max-h-80 gap-1.5 overflow-y-auto pr-1">
                  {targeted.map((student) => {
                    const entry = profiles.get(student.id);
                    const incompleteProfile =
                      !student.section || !student.studentNumber;
                    return (
                      <li
                        key={student.id}
                        className={`flex items-start justify-between gap-2 rounded-md border px-3 py-2 text-xs ${
                          incompleteProfile
                            ? "border-[#ecd3a4] bg-[#fdf5ee]"
                            : entry && entry.active > 0
                              ? "border-[#f0e0ae] bg-[#fdf6e3]"
                              : "border-[#d9e6de] bg-white"
                        }`}>
                        <div className="min-w-0">
                          <span className="block truncate font-semibold text-[#14251d]">
                            {student.fullName}
                          </span>
                          <span className="block truncate text-[#5d6f66]">
                            {student.email}
                          </span>
                          {entry ? (
                            <span className="mt-1 flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-block h-2 w-2 rounded-full ${statusTone[entry.last!]}`}
                                aria-hidden="true"
                              />
                              <span className="font-mono text-[10px] uppercase tracking-wide text-[#5d6f66]">
                                {entry.active > 0
                                  ? `${entry.active} active request${entry.active === 1 ? "" : "s"}`
                                  : "No active requests"}
                              </span>
                              {entry.completed > 0 ? (
                                <span className="font-mono text-[10px] uppercase tracking-wide text-[#087a54]">
                                  {entry.completed} completed
                                </span>
                              ) : null}
                              {entry.last === "completed" ? (
                                <span className="font-mono text-[10px] uppercase tracking-wide text-[#087a54]">
                                  ready to pay
                                </span>
                              ) : null}
                            </span>
                          ) : (
                            <span className="mt-1 block text-[10px] uppercase tracking-wide text-[#5d6f66]">
                              No requests yet
                            </span>
                          )}
                        </div>
                        {incompleteProfile ? (
                          <span
                            className="shrink-0 text-[#b07b17]"
                            title="Incomplete profile">
                            <FiUserX aria-hidden="true" />
                          </span>
                        ) : (
                          <span
                            className="shrink-0 text-[#087a54]"
                            title="Verified profile">
                            <FiUserCheck aria-hidden="true" />
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-3 flex items-center gap-4 border-t border-[#e7efea] pt-3 text-[11px] text-[#5d6f66]">
                  <span className="flex items-center gap-1.5">
                    <FiUserCheck className="text-[#087a54]" aria-hidden="true" />
                    {verified.length} verified
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FiUserX className="text-[#b07b17]" aria-hidden="true" />
                    {incomplete.length} incomplete
                  </span>
                </div>
                {incomplete.length > 0 ? (
                  <p className="mt-2 flex items-start gap-1.5 rounded-md bg-[#fdf5ee] px-3 py-2 text-[11px] leading-relaxed text-[#7a4a13]">
                    <FiAlertCircle
                      className="mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    Students with an incomplete profile are skipped and will not
                    receive the email.
                  </p>
                ) : null}
              </>
            ) : (
              <p className="mt-3 text-xs text-[#5d6f66]">
                No students in this section yet.
              </p>
            )
          ) : (
            <div className="mt-3 grid place-items-center rounded-md border border-dashed border-[#d3e1d9] bg-white px-4 py-8 text-center text-xs text-[#5d6f66]">
              <FiMail className="mb-2 text-xl text-[#5d6f66]" aria-hidden="true" />
              Choose a section above to preview the students who will be
              notified.
            </div>
          )}
        </aside>
      </form>
    </section>
  );
}

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-[#0c8f62] px-6 text-sm font-bold text-white transition hover:bg-[#087650] disabled:cursor-wait disabled:opacity-70 sm:w-auto sm:min-w-[12rem]">
      <FiSend className="text-sm" aria-hidden="true" />
      {pending ? "Sendingâ€¦" : "Send notification"}
    </button>
  );
}
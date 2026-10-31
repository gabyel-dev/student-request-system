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
import type { StudentRequest, RequestStatus } from "@/src/domain/request";
import type { User } from "@/src/domain/user";

const initialState: MailActionState = { error: null, success: null };
const ALL_SECTIONS = "__all__";

function buildSectionList(students: User[]): string[] {
  return [
    ...new Set(
      students.map((s) => s.section).filter((s): s is string => Boolean(s)),
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
  const [section, setSection] = useState("");
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const [state, formAction] = useActionState(
    sendSectionAnnouncement,
    initialState,
  );

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
    const perUser = new Map<
      string,
      { active: number; completed: number; last: RequestStatus | null }
    >();
    for (const r of requests) {
      const e = perUser.get(r.userId) ?? {
        active: 0,
        completed: 0,
        last: null as RequestStatus | null,
      };
      if (r.status === "pending" || r.status === "processing") e.active += 1;
      if (r.status === "completed") e.completed += 1;
      e.last = r.status;
      perUser.set(r.userId, e);
    }
    return perUser;
  }, [requests]);

  const targeted = useMemo(() => {
    if (!section) return [];
    return students
      .filter((s) =>
        section === ALL_SECTIONS ? Boolean(s.section) : s.section === section,
      )
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [section, students]);

  const verified = targeted.filter((s) =>
    Boolean(s.section && s.studentNumber),
  );
  const incomplete = targeted.filter((s) => !s.section || !s.studentNumber);

  return (
    <section
      id="email"
      className="scroll-mt-24 rounded-2xl border border-[#E6ECE8] bg-white p-4 shadow-[0_1px_2px_rgba(18,28,22,0.06)] sm:p-6">
      <div className="flex items-center gap-2">
        <FiMail className="text-[#0B6B4A]" aria-hidden="true" />
        <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-[#17211B]">
          Email students
        </h2>
      </div>
      <p className="mt-1 text-[13px] text-[#62716A]">
        Send an announcement to a whole section, or to every verified student.
      </p>

      <form
        action={formAction}
        className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid content-start gap-4">
          <div>
            <label
              htmlFor="email-section"
              className="mb-1.5 block text-xs font-semibold text-[#17211B]">
              Section
            </label>
            <select
              id="email-section"
              name="section"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              required
              className="w-full rounded-xl border border-[#DDE5E0] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#0B6B4A]">
              <option value="" disabled>
                Choose a section…
              </option>
              <option value={ALL_SECTIONS}>All verified students</option>
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
              className="mb-1.5 block text-xs font-semibold text-[#17211B]">
              Subject
            </label>
            <input
              id="email-subject"
              name="subject"
              type="text"
              required
              maxLength={120}
              placeholder="e.g. Ready to claim your document"
              className="w-full rounded-xl border border-[#DDE5E0] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#0B6B4A]"
            />
          </div>
          <div>
            <label
              htmlFor="email-message"
              className="mb-1.5 block text-xs font-semibold text-[#17211B]">
              Message
            </label>
            <textarea
              id="email-message"
              name="message"
              ref={messageRef}
              required
              rows={7}
              maxLength={4000}
              placeholder="Write the announcement the students will receive…"
              className="w-full resize-y rounded-xl border border-[#DDE5E0] bg-white px-3.5 py-2.5 text-sm leading-relaxed outline-none focus:border-[#0B6B4A]"
            />
          </div>
          <div className="grid gap-2">
            <SendButton />
            <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-[#62716A]">
              <FiAlertCircle className="mt-0.5 shrink-0 text-amber-700" />
              Don&apos;t close this tab while sending email. Progress appears in
              the bottom-right corner.
            </p>
          </div>
        </div>

        <aside className="rounded-xl border border-[#EEF2EF] bg-[#FAFBFA] p-4">
          <div className="flex items-center justify-between">
            <strong className="text-xs font-semibold uppercase tracking-wide text-[#3E4B44]">
              Recipients
            </strong>
            <span className="font-mono text-xs tabular-nums text-[#0B6B4A]">
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
                        className={`flex items-start justify-between gap-2 rounded-xl border px-3 py-2 ${
                          incompleteProfile
                            ? "border-amber-200 bg-amber-50/50"
                            : "border-[#EEF2EF] bg-white"
                        }`}>
                        <div className="min-w-0">
                          <span className="block truncate text-[13px] font-medium text-[#17211B]">
                            {student.fullName}
                          </span>
                          <span className="block truncate text-xs text-[#62716A]">
                            {student.email}
                          </span>
                          <span className="mt-1 block text-[11px] text-[#62716A]">
                            {entry
                              ? entry.active > 0
                                ? `${entry.active} active`
                                : entry.completed > 0
                                  ? `${entry.completed} completed`
                                  : "No active requests"
                              : "No requests yet"}
                          </span>
                        </div>
                        {incompleteProfile ? (
                          <FiUserX
                            className="mt-1 shrink-0 text-amber-700"
                            aria-label="Incomplete profile"
                          />
                        ) : (
                          <FiUserCheck
                            className="mt-1 shrink-0 text-[#0B6B4A]"
                            aria-label="Verified profile"
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-3 flex items-center gap-4 border-t border-[#EEF2EF] pt-3 text-[11px] text-[#62716A]">
                  <span className="flex items-center gap-1.5">
                    <FiUserCheck className="text-[#0B6B4A]" />
                    {verified.length} verified
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FiUserX className="text-amber-700" />
                    {incomplete.length} incomplete
                  </span>
                </div>
                {incomplete.length > 0 ? (
                  <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">
                    <FiAlertCircle className="mt-0.5 shrink-0" /> Incomplete
                    profiles are skipped automatically.
                  </p>
                ) : null}
              </>
            ) : (
              <p className="mt-3 text-xs text-[#62716A]">
                No students in this section yet.
              </p>
            )
          ) : (
            <div className="mt-3 grid place-items-center rounded-xl border border-dashed border-[#DDE5E0] bg-white px-4 py-8 text-center text-xs text-[#62716A]">
              <FiMail className="mb-2 text-xl" aria-hidden="true" />
              Choose a section to preview recipients.
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
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#0B6B4A] px-6 text-sm font-semibold text-white hover:bg-[#095a3e] disabled:opacity-70 sm:w-auto">
      <FiSend className="text-sm" aria-hidden="true" />
      {pending ? "Sending…" : "Send notification"}
    </button>
  );
}

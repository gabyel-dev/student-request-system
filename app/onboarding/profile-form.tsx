"use client";

import { useActionState, useCallback, useState } from "react";
import { useFormStatus } from "react-dom";
import { FiAlertCircle, FiCheck } from "react-icons/fi";
import {
  saveStudentProfile,
  type ProfileFormState,
} from "@/app/actions/profile";
import { useGlobalLoading } from "@/app/components/global-loader";

const initialState: ProfileFormState = { error: null };

/** The registrar's standard issue format, e.g. 24BSIT-0123. */
const STANDARD_ID = /^[0-9]{2}[A-Z]{4}-[0-9]{4}$/;

type IdFormat = {
  id: string;
  title: string;
  /** Shown on the card and under the input — keep it a real example. */
  example: string;
  rule: string;
  pattern?: string;
  maxLength: number;
  placeholder: string;
};

/**
 * Every format a student might hold. To support another one, append an
 * entry — the picker, the input constraints, and the example hint all read
 * from this list.
 */
const ID_FORMATS: IdFormat[] = [
  {
    id: "standard",
    title: "Standard",
    example: "24BSIT-0123",
    rule: "2 digits, 4 letters, dash, 4 digits",
    pattern: "[0-9]{2}[A-Z]{4}-[0-9]{4}",
    maxLength: 11,
    placeholder: "e.g. 24BSIT-0123",
  },
  {
    id: "custom",
    title: "Custom",
    example: "As printed on your ID",
    rule: "Any other format the school issued",
    maxLength: 32,
    placeholder: "Enter your ID exactly as issued",
  },
];

const labelClass =
  "mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted";
const inputClass =
  "min-h-14 w-full rounded-2xl border border-hairline bg-surface px-4 text-[15px] text-ink outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-6 text-sm font-bold text-white transition hover:bg-accent-hover disabled:cursor-wait disabled:opacity-70">
      {pending ? "Saving your details…" : "Continue to dashboard"}
    </button>
  );
}

export function ProfileForm({
  section,
  studentNumber,
}: {
  section: string;
  studentNumber: string | null;
}) {
  const { start, stop, startNavigation } = useGlobalLoading();
  const wrappedAction = useCallback(
    async (prev: ProfileFormState, formData: FormData) => {
      start();
      try {
        const result = await saveStudentProfile(prev, formData);
        if (!result.error) startNavigation();
        return result;
      } finally {
        stop();
      }
    },
    [start, stop, startNavigation],
  );
  const [state, formAction] = useActionState(wrappedAction, initialState);

  // If the stored ID doesn't match the standard format, it must be a custom
  // one — default the choice accordingly so the student is never blocked by
  // a pattern their ID can't satisfy.
  const [formatId, setFormatId] = useState<string>(() =>
    studentNumber && !STANDARD_ID.test(studentNumber.trim().toUpperCase())
      ? "custom"
      : "standard",
  );
  const activeFormat =
    ID_FORMATS.find((format) => format.id === formatId) ?? ID_FORMATS[0];

  const existingSection = /^(\S+)\s+([1-4])([A-Za-z]{1,3})$/.exec(section);
  const initialCourse = existingSection?.[1] ?? "";
  const initialYear = existingSection?.[2] ?? "";
  const initialSectionCode = existingSection?.[3] ?? "";

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <div>
        <label htmlFor="course" className={labelClass}>
          Course
        </label>
        <input
          id="course"
          name="course"
          type="text"
          defaultValue={initialCourse}
          placeholder="e.g. BSIT"
          required
          minLength={4}
          maxLength={4}
          pattern="[A-Za-z]{4}"
          autoCapitalize="characters"
          autoComplete="off"
          className={inputClass}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="year" className={labelClass}>
            Year level
          </label>
          <select
            id="year"
            name="year"
            defaultValue={initialYear}
            required
            className={inputClass}>
            <option value="" disabled>
              Select year
            </option>
            <option value="1">1st year</option>
            <option value="2">2nd year</option>
            <option value="3">3rd year</option>
            <option value="4">4th year</option>
          </select>
        </div>
        <div>
          <label htmlFor="sectionCode" className={labelClass}>
            Section
          </label>
          <input
            id="sectionCode"
            name="sectionCode"
            type="text"
            defaultValue={initialSectionCode}
            placeholder="e.g. A or AB"
            required
            minLength={1}
            maxLength={2}
            pattern="[A-Za-z]{1,2}"
            autoCapitalize="characters"
            autoComplete="off"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <span id="id-format-label" className={labelClass}>
          Student number format
        </span>
        <div
          role="radiogroup"
          aria-labelledby="id-format-label"
          className="grid gap-2 sm:grid-cols-2">
          {ID_FORMATS.map((format) => {
            const selected = format.id === formatId;
            return (
              <label
                key={format.id}
                className={`cursor-pointer rounded-2xl border p-4 text-left transition ${
                  selected
                    ? "border-accent bg-accent-soft/40 shadow-[0_1px_2px_rgba(18,28,22,0.08)]"
                    : "border-hairline bg-surface hover:border-accent/40"
                }`}>
                <input
                  type="radio"
                  name="idFormat"
                  value={format.id}
                  checked={selected}
                  onChange={() => setFormatId(format.id)}
                  className="sr-only"
                />
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-bold text-ink">
                    {format.title}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`grid h-5 w-5 place-items-center rounded-full border transition ${
                      selected
                        ? "border-accent bg-accent text-white"
                        : "border-hairline text-transparent"
                    }`}>
                    <FiCheck size={12} />
                  </span>
                </span>
                <span className="mt-2 block font-mono text-[13px] tabular-nums text-accent">
                  {format.example}
                </span>
                <span className="mt-1 block text-[11px] leading-4 text-muted">
                  {format.rule}
                </span>
              </label>
            );
          })}
        </div>

        <label htmlFor="studentNumber" className={`${labelClass} mt-5`}>
          Student number
        </label>
        <input
          id="studentNumber"
          name="studentNumber"
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          defaultValue={studentNumber ?? ""}
          placeholder={activeFormat.placeholder}
          required
          maxLength={activeFormat.maxLength}
          pattern={activeFormat.pattern}
          className={inputClass}
        />
        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-xs leading-5 text-muted">
          <span>Example:</span>
          <span className="font-mono tabular-nums text-ink">
            {activeFormat.example}
          </span>
        </p>
      </div>

      {state.error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-2xl border border-rejected/30 bg-rejected-soft px-4 py-3 text-sm text-rejected">
          <FiAlertCircle aria-hidden="true" className="mt-0.5 shrink-0" />
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

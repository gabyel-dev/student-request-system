"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  saveStudentProfile,
  type ProfileFormState,
} from "@/app/actions/profile";

const initialState: ProfileFormState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-3 inline-flex min-h-12 w-full items-center justify-center bg-[#0c8f62] px-6 text-sm font-bold text-white transition hover:bg-[#087650] disabled:cursor-wait disabled:opacity-70">
      {pending ? "Saving your details..." : "Continue to dashboard"}
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
  const [state, formAction] = useActionState(saveStudentProfile, initialState);
  const existingSection = /^(\S+)\s+([1-4])([A-Za-z]{1,3})$/.exec(section);
  const initialCourse = existingSection?.[1] ?? "";
  const initialYear = existingSection?.[2] ?? "";
  const initialSectionCode = existingSection?.[3] ?? "";

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <div>
        <label
          htmlFor="course"
          className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#356455]">
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
          className="min-h-14 w-full border border-[#b8d4c6] bg-white px-4 text-base text-[#17392d] outline-none transition placeholder:text-[#8aa79a] focus:border-[#0c8f62] focus:ring-2 focus:ring-[#0c8f62]/20"
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="year"
            className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#356455]">
            Year level
          </label>
          <select
            id="year"
            name="year"
            defaultValue={initialYear}
            required
            className="min-h-14 w-full border border-[#b8d4c6] bg-white px-4 text-base text-[#17392d] outline-none transition focus:border-[#0c8f62] focus:ring-2 focus:ring-[#0c8f62]/20">
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
          <label
            htmlFor="sectionCode"
            className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#356455]">
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
            className="min-h-14 w-full border border-[#b8d4c6] bg-white px-4 text-base text-[#17392d] outline-none transition placeholder:text-[#8aa79a] focus:border-[#0c8f62] focus:ring-2 focus:ring-[#0c8f62]/20"
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="studentNumber"
          className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#356455]">
          Student number
        </label>
        <input
          id="studentNumber"
          name="studentNumber"
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          defaultValue={studentNumber ?? ""}
          placeholder="e.g. 24BSIT-0123"
          required
          pattern="[0-9]{2}[A-Z]{4}-[0-9]{4}"
          className="min-h-14 w-full border border-[#b8d4c6] bg-white px-4 text-base text-[#17392d] outline-none transition placeholder:text-[#8aa79a] focus:border-[#0c8f62] focus:ring-2 focus:ring-[#0c8f62]/20"
        />
      </div>
      {state.error ? (
        <p
          role="alert"
          className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}

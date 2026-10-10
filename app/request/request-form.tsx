"use client";

import { useActionState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { FiArrowLeft } from "react-icons/fi";
import {
  submitRequest,
  updateRequest,
  type RequestActionState,
} from "@/app/actions/requests";
import { useGlobalLoading } from "@/app/components/global-loader";
import { useToast } from "@/app/components/toaster";
import type { Student } from "@/app/dashboard/types";
import type { ServiceDefinition } from "@/src/domain/services";

const initialState: RequestActionState = { error: null, success: null };

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-8 text-sm font-bold text-white transition hover:bg-accent-hover disabled:cursor-wait disabled:opacity-70 sm:w-auto">
      {pending
        ? editing
          ? "Saving…"
          : "Submitting…"
        : editing
          ? "Save changes"
          : "Submit request"}
    </button>
  );
}

export function RequestForm({
  service,
  student,
  editingRequest,
}: {
  service: ServiceDefinition;
  student: Student;
  editingRequest?: {
    id: string;
    notes: string;
    proofUrl: string | null;
  } | null;
}) {
  const editing = Boolean(editingRequest);
  const action = editing ? updateRequest : submitRequest;
  const { start, stop, startNavigation } = useGlobalLoading();
  const wrappedAction = useCallback(
    async (prev: RequestActionState, formData: FormData) => {
      start();
      try {
        const result = await action(prev, formData);
        if (!result.error) startNavigation();
        return result;
      } finally {
        stop();
      }
    },
    [action, start, stop, startNavigation],
  );
  const [state, formAction] = useActionState(wrappedAction, initialState);
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  useEffect(() => {
    if (state.success) {
      toastSuccess(state.success);
      router.push("/dashboard");
    } else if (state.error) {
      toastError(state.error);
    }
  }, [state, toastSuccess, toastError, router]);

  return (
    <main className="min-h-screen bg-sunken text-ink">
      <div
        aria-hidden="true"
        className="h-1 bg-gradient-to-r from-accent via-accent/50 to-transparent"
      />
      <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-accent transition hover:text-accent-hover">
          <FiArrowLeft size={16} aria-hidden="true" />
          Back to dashboard
        </a>

        <section className="mt-6 overflow-hidden rounded-2xl border border-hairline bg-surface shadow-[0_1px_2px_rgba(18,28,22,0.06)]">
          <div className="border-b border-rule px-5 py-6 sm:px-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
              {editing ? "Edit request" : "New request"}
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-[-0.02em] text-ink">
              {service.title}
            </h1>
            <p className="mt-1.5 text-sm leading-6 text-muted">
              {service.description}
            </p>
          </div>

          <div className="px-5 py-6 sm:px-8">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
              Verification details
            </h2>
            <dl className="mt-3 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              <Detail label="Full name" value={student.name} />
              <Detail label="Section" value={student.section} />
              <Detail
                label="Student number"
                value={student.studentNumber || "Not on record"}
              />
              <Detail label="Email" value={student.email} />
            </dl>

            <div className="mt-6 rounded-2xl bg-sunken p-4">
              <p className="text-[13px] leading-6 text-muted">
                <strong className="font-semibold text-ink">
                  What happens next:
                </strong>{" "}
                submitting creates your request instantly and assigns it a queue
                number for your section. You can track it from your dashboard.
              </p>
            </div>

            <form action={formAction} className="mt-6">
              <input type="hidden" name="documentType" value={service.title} />
              {editing && editingRequest ? (
                <input
                  type="hidden"
                  name="requestId"
                  value={editingRequest.id}
                />
              ) : null}

              {service.title === "Others" ? (
                <div className="mb-5">
                  <label
                    htmlFor="request-notes"
                    className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                    Explain your request
                  </label>
                  <textarea
                    id="request-notes"
                    name="notes"
                    defaultValue={editingRequest?.notes ?? ""}
                    required
                    maxLength={500}
                    rows={5}
                    placeholder="Tell the registrar what you need help with."
                    className="mt-2 w-full resize-y rounded-xl border border-hairline bg-white px-3.5 py-3 text-sm leading-6 text-ink outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/15"
                  />
                  <p className="mt-1.5 text-xs leading-5 text-muted">
                    Please provide enough detail for the registrar to review
                    your request.
                  </p>
                </div>
              ) : null}

              <SubmitButton editing={editing} />
              <p className="mt-3 text-xs leading-5 text-muted">
                {editing
                  ? "Only pending requests can be edited."
                  : "You can edit or delete this request while it is still pending."}
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium text-ink">{value}</dd>
    </div>
  );
}

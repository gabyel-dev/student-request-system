"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import {
  FiArrowLeft,
  FiFile,
  FiFileText,
  FiImage,
  FiTrash,
  FiUpload,
  FiX,
} from "react-icons/fi";
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

const ALLOWED_EXTENSIONS = ".png,.jpg,.jpeg,.webp,.gif,.pdf";

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-4 inline-flex min-h-12 w-full items-center justify-center bg-[#0c8f62] px-6 text-sm font-bold text-white transition hover:bg-[#087650] disabled:cursor-wait disabled:opacity-70 sm:w-auto sm:min-w-[12rem]">
      {pending
        ? editing
          ? "Savingâ€¦"
          : "Submittingâ€¦"
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
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeProof, setRemoveProof] = useState(false);

  useEffect(() => {
    if (state.success) {
      toastSuccess(state.success);
      router.push("/dashboard");
    } else if (state.error) {
      toastError(state.error);
    }
  }, [state, toastSuccess, toastError, router]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setFileName(null);
      setPreviewUrl(null);
      return;
    }
    setRemoveProof(false);
    setFileName(file.name);
    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  }

  function clearFile() {
    setFileName(null);
    setPreviewUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleRemoveExistingProof() {
    setRemoveProof(true);
    clearFile();
  }

  const showExistingProof =
    editing && editingRequest?.proofUrl && !removeProof && !fileName;

  return (
    <main className="min-h-screen bg-[#f2f6f3] text-[#14251d]">
      <div className="mx-auto w-[calc(100%-32px)] max-w-2xl py-6 sm:w-[calc(100%-42px)] sm:py-8 lg:w-[calc(100%-64px)] lg:py-10">
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#087a54] transition hover:opacity-70">
          <FiArrowLeft /> Back to dashboard
        </a>

        <section className="mt-6 rounded-tr-3xl rounded-bl-3xl border border-white/70 bg-[rgba(247,255,251,.92)] p-5 shadow-[18px_24px_70px_rgba(0,0,0,.4)] backdrop-blur sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#087a54]">
                {editing ? "Edit request" : "New request"}
              </p>
              <h1 className="mt-2 text-xl font-bold tracking-[-.03em] text-[#14251d] sm:text-2xl">
                {service.title}
              </h1>
              <p className="mt-1 text-sm text-[#5d6f66]">
                {service.description}
              </p>
            </div>
            <FiFileText className="shrink-0 text-2xl text-[#087a54]/30" />
          </div>

          <div className="mt-6 rounded-sm border border-[#e7efea] bg-[#f7fbf9] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#5d6f66]">
              Verification details
            </p>
            <dl className="mt-3 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[.08em] text-[#8aa198]">
                  Full name
                </dt>
                <dd className="mt-0.5 font-medium text-[#14251d]">
                  {student.name}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[.08em] text-[#8aa198]">
                  Section
                </dt>
                <dd className="mt-0.5 font-medium text-[#14251d]">
                  {student.section}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[.08em] text-[#8aa198]">
                  Student number
                </dt>
                <dd className="mt-0.5 font-medium text-[#14251d]">
                  {student.studentNumber || "Not on record"}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[.08em] text-[#8aa198]">
                  Email
                </dt>
                <dd className="mt-0.5 font-medium text-[#14251d]">
                  {student.email}
                </dd>
              </div>
            </dl>
          </div>

          <form action={formAction} className="mt-6 space-y-5">
            <input type="hidden" name="documentType" value={service.title} />
            {editing ? (
              <input
                type="hidden"
                name="requestId"
                value={editingRequest?.id}
              />
            ) : null}
            {removeProof ? (
              <input type="hidden" name="removeProof" value="true" />
            ) : null}

            <div>
              <label
                htmlFor="notes"
                className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#356455]">
                Additional notes{" "}
                <span className="font-normal normal-case tracking-normal text-[#8aa198]">
                  (optional)
                </span>
              </label>
              <textarea
                id="notes"
                name="notes"
                maxLength={500}
                rows={4}
                defaultValue={editingRequest?.notes ?? ""}
                placeholder="Add details that will help staff understand your request â€” e.g. semester, section, subject, reason, etc."
                className="w-full border border-[#b8d4c6] bg-white px-4 py-3 text-sm text-[#17392d] outline-none transition placeholder:text-[#8aa79a] focus:border-[#0c8f62] focus:ring-2 focus:ring-[#0c8f62]/20"
              />
              <p className="mt-1 text-right text-[11px] text-[#8aa198]">
                Max 500 characters
              </p>
            </div>

            <div>
              <label
                htmlFor="proof"
                className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#356455]">
                Proof / supporting document{" "}
                <span className="font-normal normal-case tracking-normal text-[#8aa198]">
                  (optional)
                </span>
              </label>
              <p className="mb-3 text-xs text-[#5d6f66]">
                Upload a screenshot, photo, or PDF to support your request.
                Max 5 MB. Accepts JPG, PNG, WEBP, GIF, or PDF.
              </p>

              {showExistingProof ? (
                <div className="mb-3 rounded-sm border border-[#e7efea] bg-[#f7fbf9] p-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[.08em] text-[#5d6f66]">
                    Current proof
                  </p>
                  {editingRequest!.proofUrl!.match(
                    /\.(png|jpe?g|webp|gif)$/i,
                  ) ? (
                    <img
                      src={editingRequest!.proofUrl!}
                      alt="Current proof"
                      className="mb-2 max-h-36 rounded-sm border border-[#e7efea] object-contain"
                    />
                  ) : (
                    <a
                      href={editingRequest!.proofUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-[#087a54] underline underline-offset-2 hover:opacity-70">
                      <FiFile /> View uploaded file
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={handleRemoveExistingProof}
                    className="inline-flex items-center gap-1 rounded-sm border border-[#e6d3d2] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#8a3a35] transition-colors hover:border-[#b0423c] hover:bg-red-50"
                    aria-label="Remove current proof">
                    <FiTrash className="text-[11px]" />
                    Remove
                  </button>
                </div>
              ) : null}

              <div className="flex items-center gap-3">
                <label
                  htmlFor="proof"
                  className="inline-flex cursor-pointer items-center gap-2 border border-[#b8d4c6] bg-white px-4 py-2.5 text-xs font-semibold text-[#087a54] transition hover:border-[#087a54]/40 hover:bg-[#f7fbf9]">
                  <FiUpload /> Choose file
                </label>
                {fileName ? (
                  <div className="flex items-center gap-2 text-xs text-[#5d6f66]">
                    {previewUrl ? (
                      <FiImage className="shrink-0 text-[#087a54]" />
                    ) : (
                      <FiFile className="shrink-0 text-[#087a54]" />
                    )}
                    <span className="max-w-[180px] truncate sm:max-w-[260px]">
                      {fileName}
                    </span>
                    <button
                      type="button"
                      onClick={clearFile}
                      className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[#b0423c] transition hover:bg-[#fdf6f6]"
                      aria-label="Remove file">
                      <FiX />
                    </button>
                  </div>
                ) : null}
                <input
                  ref={fileRef}
                  id="proof"
                  name="proof"
                  type="file"
                  accept={ALLOWED_EXTENSIONS}
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </div>
              {previewUrl ? (
                <div className="mt-3">
                  <img
                    src={previewUrl}
                    alt="File preview"
                    className="max-h-48 rounded-sm border border-[#e7efea] object-contain"
                  />
                </div>
              ) : null}
            </div>

            <SubmitButton editing={editing} />
          </form>
        </section>
      </div>
    </main>
  );
}
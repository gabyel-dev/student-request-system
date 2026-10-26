"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";

type LegalTab = "terms" | "privacy";

const TABS: { id: LegalTab; label: string }[] = [
  { id: "terms", label: "Terms and Conditions" },
  { id: "privacy", label: "Privacy Policy" },
];

const CONTENT: Record<LegalTab, string> = {
  terms:
    "By signing in, you agree to use itikQ only for legitimate PTC document requests. Submit accurate details, keep your account secure, and follow PTC request and pickup policies. Accounts that misuse the service may be restricted.",
  privacy:
    "itikQ uses your school Google name, email, profile photo, section, and student number only to process and track your requests. Your request details are visible to authorized PTC registrar staff. We do not sell your information or share it outside school student services.",
};

export function LoginLegalNotice({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState<LegalTab | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(null);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const tab = open ?? "terms";

  return (
    <>
      <p className={className}>
        <button
          type="button"
          onClick={() => setOpen("terms")}
          className="underline underline-offset-2 transition hover:text-white">
          Terms and Conditions
        </button>{" "}
        and{" "}
        <button
          type="button"
          onClick={() => setOpen("privacy")}
          className="underline underline-offset-2 transition hover:text-white">
          Privacy Policy
        </button>
        .
      </p>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[120] flex items-center justify-center bg-[#041b14]/60 p-4 backdrop-blur-sm sm:p-6"
              onClick={() => setOpen(null)}>
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                onClick={(event) => event.stopPropagation()}
                className="relative w-full max-w-md rounded-[28px] border border-white/70 bg-[#f5fffa] p-6 text-[#17392d] shadow-[18px_24px_60px_rgba(5,45,34,0.24)] sm:p-7">
                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => setOpen(null)}
                  aria-label="Close legal notice"
                  className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-[#52706a] transition hover:bg-black/5 hover:text-[#17392d]">
                  <FiX aria-hidden="true" size={17} />
                </button>

  
                <h2
                  id={titleId}
                  className="mt-1 pr-8 text-xl font-bold tracking-[-0.02em]">
                  {tab === "terms" ? "Terms and Conditions" : "Privacy Policy"}
                </h2>

                <div className="mt-5 flex gap-1 rounded-full border border-[#dcebe4] bg-white/70 p-1">
                  {TABS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setOpen(item.id)}
                      className={`flex-1 rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
                        tab === item.id
                          ? "bg-[#0b6b4a] text-white"
                          : "text-[#52706a] hover:bg-white hover:text-[#17392d]"
                      }`}>
                      {item.label}
                    </button>
                  ))}
                </div>

                <p className="mt-5 text-sm leading-6 text-[#52706a]">
                  {CONTENT[tab]}
                </p>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setOpen(null)}
                    className="inline-flex min-h-10 items-center rounded-full bg-[#0b6b4a] px-5 text-sm font-bold text-white transition hover:bg-[#085539]">
                    Close
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

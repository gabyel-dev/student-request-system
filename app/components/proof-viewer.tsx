"use client";

import { useState } from "react";
import { FiExternalLink, FiX } from "react-icons/fi";

export function ProofViewer({
  url,
  label = "View proof",
}: {
  url: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const isImage = /\.(png|jpe?g|webp|gif)(?:$|[?#])/i.test(url);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent hover:underline">
        {label}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={label}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}>
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl bg-surface p-4 shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close proof preview"
              className="absolute right-3 top-3 z-10 rounded-full bg-ink/80 p-2 text-white transition hover:bg-ink">
              <FiX size={17} aria-hidden="true" />
            </button>
            {isImage ? (
              <img
                src={url}
                alt="Uploaded proof"
                className="mx-auto max-h-[82vh] max-w-full rounded-lg object-contain"
              />
            ) : (
              <iframe
                src={url}
                title="Uploaded proof"
                className="h-[80vh] w-full rounded-lg border border-hairline"
              />
            )}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline">
              <FiExternalLink size={13} aria-hidden="true" />
              Open in new tab
            </a>
          </div>
        </div>
      ) : null}
    </>
  );
}

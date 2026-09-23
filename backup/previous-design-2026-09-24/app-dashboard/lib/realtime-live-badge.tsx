"use client";

/**
 * Tiny indicator that shows when the Supabase Realtime channel is connected.
 * The pulsing dot communicates "this list updates live" without explaining
 * itself in words.
 */
export function RealtimeLiveBadge({ isLive }: { isLive: boolean }) {
  if (!isLive) return null;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#bcd9c8] bg-[#e9f6f0] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#087a54]">
      <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#087a54] opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#087a54]" />
      </span>
      Live
    </span>
  );
}
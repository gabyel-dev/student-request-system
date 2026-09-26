"use client";

import type { ElementType } from "react";

/**
 * The dashboard's icon system: IconPark, two-tone, one family.
 *
 * Every icon in the product goes through this module. That is deliberate. A
 * two-tone icon only reads as part of a system if the two tones are chosen
 * from the same short list every time, so the pairs live here as a fixed
 * palette instead of being picked at each call site, where they would drift.
 *
 * The rule the palette encodes:
 *   - navigation and neutral icons are ink, so they recede
 *   - the primary action and completed state are the accent
 *   - status icons take their status hue, because colour is the fastest way to
 *     scan a column of states
 *   - nothing gets a colour of its own
 *
 * The secondary tone is always a light companion of the primary, so the
 * "filled" part of the drawing recedes behind the outline and the icon keeps
 * its shape at 16px.
 */
export type IconTone =
  | "neutral"
  | "muted"
  | "accent"
  | "pending"
  | "processing"
  | "completed"
  | "rejected"
  | "inverse";

const TONES: Record<IconTone, { primary: string; secondary: string }> = {
  neutral: { primary: "#43524b", secondary: "#c3cfc9" },
  muted: { primary: "#6a7871", secondary: "#d5dcd9" },
  accent: { primary: "#0b6b4a", secondary: "#a9cdbb" },
  pending: { primary: "#96690f", secondary: "#ecd9a8" },
  // A lighter, cooler step of the brand green. Processing was blue, which made
  // the one status a student sees most of the time look like it belonged to a
  // different product. It stays a step apart from `completed` rather than
  // matching it: the lighter weight reads as "moving", the deeper one as
  // "settled", and the Loading/Check icons and the labels carry the difference
  // regardless. Checked against `--color-processing-soft` at 4.7:1 for the
  // 11px pill text.
  processing: { primary: "#0d7a5b", secondary: "#b3ddcc" },
  completed: { primary: "#0b6b4a", secondary: "#a9cdbb" },
  rejected: { primary: "#a33f39", secondary: "#eec3bf" },
  /** For the dark navigation rail, where ink tones would disappear. */
  inverse: { primary: "#ffffff", secondary: "#7fae97" },
};

export function Icon({
  icon,
  tone = "neutral",
  size = 18,
  className,
  label,
}: {
  icon: ElementType;
  tone?: IconTone;
  /** Rendered in pixels. IconPark's art is drawn on a 48-unit grid. */
  size?: number;
  className?: string;
  /**
   * Supply only when the icon carries meaning that is not already in adjacent
   * text. Without it the icon is hidden from assistive technology, which is
   * what almost every icon in a dashboard should be.
   */
  label?: string;
}) {
  const { primary, secondary } = TONES[tone];
  const Glyph = icon;

  return (
    <Glyph
      theme="two-tone"
      size={size}
      primaryColor={primary}
      secondaryColor={secondary}
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}

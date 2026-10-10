import type { ReactElement, ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* Hand-drawn service icons for the request picker.                     */
/* Ink inherits the surrounding text color; emerald carries the meaning.*/
/* Tweak ACCENT if the student theme's green shifts.                    */
/* ------------------------------------------------------------------ */

export const SERVICE_ACCENT = "#0C8F62";

function IconShell({
  size = 24,
  className,
  children,
}: {
  size?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true">
      {children}
    </svg>
  );
}

export type ServiceIcon = (props: {
  size?: number;
  className?: string;
}) => ReactElement;

/** Good Moral Character — a shield, check in emerald. */
export function MoralIcon({
  size,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <IconShell size={size} className={className}>
      <path d="M12 3l7 2.8v5.4c0 4.6-3 7.8-7 9.8-4-2-7-5.2-7-9.8V5.8L12 3z" />
      <path d="M9 11.7l2.2 2.2 3.9-4.3" stroke={SERVICE_ACCENT} />
    </IconShell>
  );
}

/** Transfer Credentials / Honorable Dismissal — a paper plane, crease in emerald. */
export function TransferIcon({
  size,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <IconShell size={size} className={className}>
      <path d="M21.5 2.5l-6.8 19-4-8.7-8.2-4.3 19-6z" />
      <path d="M21.5 2.5L10.7 13.3" stroke={SERVICE_ACCENT} />
    </IconShell>
  );
}

/** Diploma — a rolled scroll, seal and ribbon in emerald. */
export function DiplomaIcon({
  size,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <IconShell size={size} className={className}>
      <path d="M7.5 8h12v8h-12z" />
      <ellipse cx="7.5" cy="12" rx="2.3" ry="4" />
      <ellipse cx="19.5" cy="12" rx="2.3" ry="4" />
      <circle cx="13.5" cy="12" r="2.3" stroke={SERVICE_ACCENT} />
      <path d="M12.6 14.2l-1.2 3.3M14.4 14.2l1.2 3.3" stroke={SERVICE_ACCENT} />
    </IconShell>
  );
}

/** Report Card / TOR / Grades — bars, tallest in emerald. */
export function GradesIcon({
  size,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <IconShell size={size} className={className}>
      <path d="M4 20h16" />
      <path d="M7.5 20v-4.5" />
      <path d="M12 20V11" />
      <path d="M16.5 20V6.5" stroke={SERVICE_ACCENT} />
    </IconShell>
  );
}

/** Certificate of Registration / Enrollment — an ID card, detail line in emerald. */
export function RegistrationIcon({
  size,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <IconShell size={size} className={className}>
      <rect x="3" y="6" width="18" height="13" rx="2.5" />
      <circle cx="8.6" cy="11.4" r="1.9" />
      <path d="M5.9 16.6c.5-1.7 1.5-2.6 2.7-2.6s2.2.9 2.7 2.6" />
      <path d="M14.5 10.2h4M14.5 13.2h4" />
      <path d="M14.5 16.2h2.5" stroke={SERVICE_ACCENT} />
    </IconShell>
  );
}

/** Fallback — a document, fold in emerald. */
export function DocumentIcon({
  size,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <IconShell size={size} className={className}>
      <path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-6-5z" />
      <path d="M13 3v5h6" stroke={SERVICE_ACCENT} />
      <path d="M9 13.5h6M9 16.8h4" />
    </IconShell>
  );
}

/* ------------------------------------------------------------------ */
/* Matching — same keyword rules the picker already used for Feather,  */
/* so this slots straight into ServiceOptions / QuickActions.          */
/* ------------------------------------------------------------------ */

const SERVICE_ICON_RULES: { test: RegExp; icon: ServiceIcon }[] = [
  { test: /moral|character/i, icon: MoralIcon },
  { test: /dismissal|transfer|credential/i, icon: TransferIcon },
  { test: /diploma|graduation/i, icon: DiplomaIcon },
  {
    test: /grade|transcript|\btor\b|report.?card|form.?137/i,
    icon: GradesIcon,
  },
  { test: /regist|enrol/i, icon: RegistrationIcon },
];

/** Pin an exact slug to an icon when the keywords get it wrong. */
export const SERVICE_ICON_OVERRIDES: Record<string, ServiceIcon> = {};

export function getServiceIcon(slug: string, title = ""): ServiceIcon {
  if (SERVICE_ICON_OVERRIDES[slug]) return SERVICE_ICON_OVERRIDES[slug];
  const haystack = `${slug} ${title}`;
  for (const rule of SERVICE_ICON_RULES) {
    if (rule.test.test(haystack)) return rule.icon;
  }
  return DocumentIcon;
}

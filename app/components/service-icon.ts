import { createElement } from "react";
import type { IconType } from "react-icons";
import {
  FiAward,
  FiBookOpen,
  FiClipboard,
  FiEdit2,
  FiFileText,
  FiHelpCircle,
  FiList,
} from "react-icons/fi";

/**
 * One library icon per document type. Both the dashboard picker and the
 * request page use this map so a service never changes shape between screens.
 */
const SERVICE_ICONS: Record<string, IconType> = {
  "certificate-of-registration": FiClipboard,
  "transcript-of-records": FiBookOpen,
  "certificate-of-grades": FiAward,
  "grade-correction": FiEdit2,
  "subject-request": FiList,
  others: FiHelpCircle,
};

export function serviceIcon(slug: string, size = 22) {
  return createElement(SERVICE_ICONS[slug] ?? FiFileText, {
    size,
    "aria-hidden": true,
  });
}

import {
  FiBookOpen,
  FiCreditCard,
  FiFileText,
  FiHelpCircle,
} from "react-icons/fi";
import type { Service } from "./types";

export const services: Service[] = [
  {
    title: "Documents",
    description: "Certificates and records",
    icon: FiFileText,
  },
  {
    title: "Clearance",
    description: "Start a clearance request",
    icon: FiBookOpen,
  },
  { title: "Transcripts", description: "Ask the registrar", icon: FiFileText },
  {
    title: "Enrollment",
    description: "Enrollment and dates",
    icon: FiBookOpen,
  },
  { title: "ID Card", description: "Request a student ID", icon: FiCreditCard },
  { title: "Other", description: "Ask the registrar", icon: FiHelpCircle },
];

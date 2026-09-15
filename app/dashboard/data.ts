import {
  FiBookOpen,
  FiEdit,
  FiFileText,
  FiGrid,
  FiHelpCircle,
} from "react-icons/fi";
import type { IconType } from "react-icons";
import { services as serviceDefinitions } from "@/src/domain/services";
import type { Service } from "./types";

const icons: Record<string, IconType> = {
  "Certificate of Registration": FiBookOpen,
  "Transcript of Records": FiFileText,
  "Certificate of Grades": FiBookOpen,
  "Grade Correction": FiEdit,
  "Subject Request": FiGrid,
  Others: FiHelpCircle,
};

export const services: Service[] = serviceDefinitions.map((service) => ({
  ...service,
  icon: icons[service.title],
}));

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((service) => service.slug === slug);
}
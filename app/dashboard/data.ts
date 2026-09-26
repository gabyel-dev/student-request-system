import { Book, Certificate, Edit, Help, List, Text } from "@icon-park/react";
import { services as serviceDefinitions } from "@/src/domain/services";
import type { Service } from "./types";

/**
 * Icon per document type.
 *
 * One family (IconPark) and one tone, applied by the shared `Icon` wrapper —
 * the mapping only decides *which* drawing, never what colour it is. Every
 * document is a sheet of paper with something specific about it, so the icons
 * differ by subject: a bound record, a stamped certificate, a correction, a
 * listed subject.
 */
const icons: Record<string, Service["icon"]> = {
  "Certificate of Registration": Certificate,
  "Transcript of Records": Book,
  "Certificate of Grades": Text,
  "Grade Correction": Edit,
  "Subject Request": List,
  Others: Help,
};

export const services: Service[] = serviceDefinitions.map((service) => ({
  ...service,
  icon: icons[service.title] ?? Help,
}));

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((service) => service.slug === slug);
}

import { services as serviceDefinitions } from "@/src/domain/services";
import type { Service } from "./types";

/**
 * Dashboard-facing service list. Icons are resolved separately by slug in
 * `app/components/service-icon.ts` so every screen uses the same icon family.
 */
export const services: Service[] = serviceDefinitions;

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((service) => service.slug === slug);
}

export type ServiceDefinition = {
  slug: string;
  title: string;
  description: string;
  aliases?: string[];
};

export const services: ServiceDefinition[] = [
  {
    slug: "certificate-of-registration",
    title: "Certificate of Registration",
    description: "Confirms your official enrollment for the current term.",
    aliases: ["COR"],
  },
  {
    slug: "certificate-of-grades",
    title: "Certificate of Grades",
    description: "A summary of the grades for one completed term.",
    aliases: ["COG"],
  },
  {
    slug: "subject-request",
    title: "Subject Request",
    description: "A subject missing from or wrong in your Google Classroom.",
  },
  {
    slug: "others",
    title: "Others",
    description: "Anything not listed here — ask the registrar.",
  },
];

export function getServiceBySlug(slug: string): ServiceDefinition | undefined {
  return services.find((service) => service.slug === slug);
}

export function getServiceByTitle(
  title: string,
): ServiceDefinition | undefined {
  return services.find((service) => service.title === title);
}

export function isServiceTitle(title: string): boolean {
  return services.some((service) => service.title === title);
}
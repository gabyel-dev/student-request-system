export type ServiceDefinition = {
  slug: string;
  title: string;
  description: string;
};

export const services: ServiceDefinition[] = [
  {
    slug: "certificate-of-registration",
    title: "Certificate of Registration",
    description: "Confirms your official enrollment for the current term.",
  },
  {
    slug: "transcript-of-records",
    title: "Transcript of Records",
    description: "Your complete list of courses and grades from past terms.",
  },
  {
    slug: "certificate-of-grades",
    title: "Certificate of Grades",
    description: "A summary of the grades for one completed term.",
  },
  {
    slug: "grade-correction",
    title: "Grade Correction",
    description: "Report a grade that needs to be corrected or removed.",
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
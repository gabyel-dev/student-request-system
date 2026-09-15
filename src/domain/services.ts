export type ServiceDefinition = {
  slug: string;
  title: string;
  description: string;
};

export const services: ServiceDefinition[] = [
  {
    slug: "certificate-of-registration",
    title: "Certificate of Registration",
    description: "Request your COR",
  },
  {
    slug: "transcript-of-records",
    title: "Transcript of Records",
    description: "Request your TOR",
  },
  {
    slug: "certificate-of-grades",
    title: "Certificate of Grades",
    description: "Request your COG",
  },
  {
    slug: "grade-correction",
    title: "Grade Correction",
    description: "Request a grade correction",
  },
  {
    slug: "subject-request",
    title: "Subject Request",
    description: "Missing or wrong subjects in Google Classroom",
  },
  {
    slug: "others",
    title: "Others",
    description: "Other requests — ask the registrar",
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
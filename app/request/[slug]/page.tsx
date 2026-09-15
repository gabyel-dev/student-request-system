import { notFound, redirect } from "next/navigation";
import { RequestForm } from "../request-form";
import { isAdminEmail } from "@/src/infrastructure/auth/admin-accounts";
import { requestRepository, userRepository } from "@/src/server/container";
import { getSessionTokenUserId } from "@/src/server/session";
import { getServiceByTitle, services } from "@/src/domain/services";

const serviceBySlug = new Map(services.map((s) => [s.slug, s]));

export default async function RequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { slug } = await params;
  const { edit: editId } = await searchParams;
  const knownService = serviceBySlug.get(slug) ?? getServiceByTitle(slug);

  const userId = await getSessionTokenUserId();
  if (!userId) redirect("/login");

  const user = await userRepository.findById(userId);
  if (!user) redirect("/login");
  if (isAdminEmail(user.email)) redirect("/dashboard");
  if (!user.section || user.studentNumber === null) redirect("/onboarding");

  let editingRequest = null;
  let fallbackDocumentType: string | null = null;

  if (editId) {
    if (!/^[0-9a-f-]{36}$/i.test(editId)) notFound();

    const request = await requestRepository.findById(editId);
    if (!request || request.userId !== userId || request.status !== "pending") {
      notFound();
    }
    fallbackDocumentType = request.documentType;
    editingRequest = {
      id: request.id,
      notes: request.notes ?? "",
      proofUrl: request.proofUrl ?? null,
    };
  }

  const service =
    knownService ||
    (editingRequest && fallbackDocumentType
      ? {
          slug: editingRequest.id,
          title: fallbackDocumentType,
          description:
            "Edit the details of this request. Changes are saved back to the same request.",
        }
      : null);

  if (!service) notFound();

  return (
    <RequestForm
      service={service}
      student={{
        name: user.fullName,
        email: user.email,
        profilePictureUrl: user.profilePictureUrl,
        section: user.section ?? "",
        studentNumber: user.studentNumber ?? "",
      }}
      editingRequest={editingRequest}
    />
  );
}
import { requestRepository, userRepository } from "@/src/server/container";
import type { AssistantContext } from "@/src/domain/assistant";

function truncate(value: string | null, max = 200): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

export async function buildAssistantContext(
  userId: string,
): Promise<AssistantContext | null> {
  const user = await userRepository.findById(userId);
  if (!user) return null;

  const requests = await requestRepository.findByUserId(userId);
  const active = requests.filter(
    (request) =>
      request.archivedAt === null && request.studentArchivedAt === null,
  );
  const archived = requests
    .filter(
      (request) =>
        request.archivedAt !== null || request.studentArchivedAt !== null,
    )
    .slice(0, 3);
  const visible = [...active.slice(0, 5), ...archived];

  return {
    user: {
      firstName: user.fullName.trim().split(/\s+/)[0] ?? user.fullName,
      section: user.section,
    },
    requests: visible.map((request) => ({
      documentType: request.documentType,
      section: request.section,
      queueNumber: request.queueNumber,
      status: request.status,
      notes: truncate(request.notes),
      createdAt: request.createdAt,
      archived:
        request.archivedAt !== null || request.studentArchivedAt !== null,
    })),
    serverTime: new Date().toISOString(),
  };
}

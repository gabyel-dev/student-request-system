"use server";

import { revalidatePath } from "next/cache";
import { isAdminEmail } from "@/src/infrastructure/auth/admin-accounts";
import { storeRequestProof } from "@/src/infrastructure/supabase/request-proof-storage";
import { requestRepository, userRepository } from "@/src/server/container";
import { getSessionTokenUserId } from "@/src/server/session";
import { isServiceTitle } from "@/src/domain/services";
import type { RequestStatus } from "@/src/domain/request";

export type RequestActionState = {
  error: string | null;
  success: string | null;
};
const requestStatuses: RequestStatus[] = [
  "pending",
  "processing",
  "completed",
  "rejected",
];

const COOLDOWN_SECONDS = 60;
const DAILY_LIMIT = 5;
const MAX_NOTES_LENGTH = 500;
const MAX_PROOF_BYTES = 5 * 1024 * 1024;
const ALLOWED_PROOF_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

/**
 * Returns an error message if the student is not allowed to create a request
 * right now (duplicate active request, daily cap, or cooldown), otherwise null.
 */
async function assertCanCreateRequest(
  userId: string,
  documentType: string,
): Promise<string | null> {
  const activeDuplicate =
    await requestRepository.findActiveByUserAndType(userId, documentType);
  if (activeDuplicate) {
    return `You already have an active ${documentType} request. Wait for it to be completed or rejected before requesting again.`;
  }

  const todayCount = await requestRepository.countTodayByUser(userId);
  if (todayCount >= DAILY_LIMIT) {
    return `You've reached the daily limit of ${DAILY_LIMIT} requests. Try again tomorrow.`;
  }

  const lastRequest = await requestRepository.findLastByUser(userId);
  if (lastRequest) {
    const elapsed =
      (Date.now() - new Date(lastRequest.createdAt).getTime()) / 1000;
    if (elapsed < COOLDOWN_SECONDS) {
      const wait = Math.ceil(COOLDOWN_SECONDS - elapsed);
      return `Please wait ${wait} second${wait === 1 ? "" : "s"} between requests.`;
    }
  }

  return null;
}

export async function submitRequest(
  _previousState: RequestActionState,
  formData: FormData,
): Promise<RequestActionState> {
  const userId = await getSessionTokenUserId();
  if (!userId)
    return {
      error: "Your session has expired. Please sign in again.",
      success: null,
    };

  const user = await userRepository.findById(userId);
  if (!user || isAdminEmail(user.email))
    return {
      error: "Only student accounts can submit requests.",
      success: null,
    };

  const documentType = String(formData.get("documentType") ?? "")
    .trim()
    .slice(0, 80);
  if (!isServiceTitle(documentType)) {
    return { error: "Choose a valid document type.", success: null };
  }

  const notes = String(formData.get("notes") ?? "")
    .trim()
    .slice(0, MAX_NOTES_LENGTH) || null;

  const proofFile = formData.get("proof");
  let proofUrl: string | null = null;

  if (proofFile instanceof File && proofFile.size > 0) {
    if (proofFile.size > MAX_PROOF_BYTES) {
      return {
        error: "Proof file must be 5MB or smaller.",
        success: null,
      };
    }
    if (!ALLOWED_PROOF_TYPES.has(proofFile.type)) {
      return {
        error: "Proof must be a JPG, PNG, WEBP, GIF, or PDF file.",
        success: null,
      };
    }
  } else if (proofFile instanceof File) {
    return { error: "Choose a valid proof file.", success: null };
  }

  const blockReason = await assertCanCreateRequest(userId, documentType);
  if (blockReason) return { error: blockReason, success: null };

  if (proofFile instanceof File && proofFile.size > 0) {
    try {
      proofUrl = await storeRequestProof({ userId, file: proofFile });
    } catch {
      return {
        error: "Your proof could not be uploaded. Check the file and try again.",
        success: null,
      };
    }
  }

  await requestRepository.create({
    userId,
    documentType,
    notes,
    proofUrl,
  });
  revalidatePath("/dashboard");
  revalidatePath("/request");
  return {
    error: null,
    success: `${documentType} request submitted successfully.`,
  };
}

export async function updateRequestStatus(
  requestId: string,
  status: RequestStatus,
): Promise<RequestActionState> {
  const userId = await getSessionTokenUserId();
  if (!userId)
    return {
      error: "Your session has expired. Please sign in again.",
      success: null,
    };

  const user = await userRepository.findById(userId);
  if (!user || !isAdminEmail(user.email))
    return { error: "Admin access is required.", success: null };
  if (!requestStatuses.includes(status))
    return { error: "Invalid request status.", success: null };
  if (!/^[0-9a-f-]{36}$/i.test(requestId))
    return {
      error: "That request could not be identified. Refresh and try again.",
      success: null,
    };

  try {
    await requestRepository.updateStatus(requestId, status);
    revalidatePath("/dashboard");
    return { error: null, success: "Request status updated." };
  } catch {
    return {
      error:
        "The request could not be updated. Check your connection and try again.",
      success: null,
    };
  }
}

export async function deleteRequest(
  requestId: string,
): Promise<RequestActionState> {
  const userId = await getSessionTokenUserId();
  if (!userId)
    return {
      error: "Your session has expired. Please sign in again.",
      success: null,
    };
  if (!/^[0-9a-f-]{36}$/i.test(requestId))
    return {
      error: "That request could not be identified. Refresh and try again.",
      success: null,
    };

  const request = await requestRepository.findById(requestId);
  if (!request)
    return { error: "Request not found.", success: null };
  if (request.userId !== userId)
    return { error: "You can only delete your own requests.", success: null };
  if (request.status !== "pending")
    return {
      error: "Only pending requests can be deleted.",
      success: null,
    };

  try {
    await requestRepository.deleteById(requestId);
    revalidatePath("/dashboard");
    revalidatePath("/request");
    return { error: null, success: "Request deleted." };
  } catch {
    return {
      error: "The request could not be deleted. Try again.",
      success: null,
    };
  }
}

export async function updateRequest(
  _previousState: RequestActionState,
  formData: FormData,
): Promise<RequestActionState> {
  const userId = await getSessionTokenUserId();
  if (!userId)
    return {
      error: "Your session has expired. Please sign in again.",
      success: null,
    };

  const requestId = String(formData.get("requestId") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(requestId))
    return {
      error: "That request could not be identified. Refresh and try again.",
      success: null,
    };

  const request = await requestRepository.findById(requestId);
  if (!request)
    return { error: "Request not found.", success: null };
  if (request.userId !== userId)
    return {
      error: "You can only edit your own requests.",
      success: null,
    };
  if (request.status !== "pending")
    return {
      error: "Only pending requests can be edited.",
      success: null,
    };

  const notes = String(formData.get("notes") ?? "")
    .trim()
    .slice(0, MAX_NOTES_LENGTH) || null;

  const proofFile = formData.get("proof");
  let proofUrl = request.proofUrl;

  if (proofFile instanceof File && proofFile.size > 0) {
    if (proofFile.size > MAX_PROOF_BYTES) {
      return {
        error: "Proof file must be 5MB or smaller.",
        success: null,
      };
    }
    if (!ALLOWED_PROOF_TYPES.has(proofFile.type)) {
      return {
        error: "Proof must be a JPG, PNG, WEBP, GIF, or PDF file.",
        success: null,
      };
    }
    try {
      proofUrl = await storeRequestProof({ userId, file: proofFile });
    } catch {
      return {
        error: "Your proof could not be uploaded. Check the file and try again.",
        success: null,
      };
    }
  } else if (proofFile instanceof File) {
    return { error: "Choose a valid proof file.", success: null };
  }

  const removeProof = formData.get("removeProof") === "true";
  if (removeProof) proofUrl = null;

  try {
    await requestRepository.updateNotesAndProof(requestId, {
      notes,
      proofUrl,
    });
    revalidatePath("/dashboard");
    revalidatePath("/request");
    return { error: null, success: "Request updated." };
  } catch {
    return {
      error: "The request could not be updated. Try again.",
      success: null,
    };
  }
}
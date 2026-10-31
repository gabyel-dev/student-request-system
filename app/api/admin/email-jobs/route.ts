import { NextResponse } from "next/server";
import { isAdminEmail } from "@/src/infrastructure/auth/admin-accounts";
import { emailJobStore } from "@/src/server/email-job-store";
import { userRepository } from "@/src/server/container";
import { getSessionTokenUserId } from "@/src/server/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getSessionTokenUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const user = await userRepository.findById(userId);
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json(
    { jobs: emailJobStore.list() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

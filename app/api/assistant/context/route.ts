import { NextResponse } from "next/server";
import { getSessionTokenUserId } from "@/src/server/session";
import { buildAssistantContext } from "@/src/server/assistant-context";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getSessionTokenUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const context = await buildAssistantContext(userId);
    if (!context) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    return NextResponse.json(context, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "context_unavailable" },
      { status: 500 },
    );
  }
}

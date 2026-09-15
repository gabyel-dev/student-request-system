import type { RequestStatus, StudentRequest } from "@/src/domain/request";
import { getSupabaseClient } from "@/src/infrastructure/supabase/supabase.client";

type RequestRow = {
  id: string;
  user_id: string;
  document_type: string;
  queue_number: number;
  status: RequestStatus;
  proof_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  users?:
    | { full_name: string; email: string }
    | { full_name: string; email: string }[]
    | null;
};

function toRequest(row: RequestRow): StudentRequest {
  const user = Array.isArray(row.users) ? row.users[0] : row.users;
  return {
    id: row.id,
    userId: row.user_id,
    studentName: user?.full_name ?? "Unknown student",
    studentEmail: user?.email ?? "",
    documentType: row.document_type,
    queueNumber: row.queue_number,
    status: row.status,
    proofUrl: row.proof_url,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const requestSelect =
  "id, user_id, document_type, queue_number, status, proof_url, notes, created_at, updated_at, users(full_name, email)";

export function createRequestRepository() {
  const client = getSupabaseClient();

  return {
    async create(input: {
      userId: string;
      documentType: string;
      notes?: string | null;
      proofUrl?: string | null;
    }) {
      const { data: latest, error: latestError } = await client
        .from("requests")
        .select("queue_number")
        .order("queue_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestError) throw latestError;

      const { data, error } = await client
        .from("requests")
        .insert({
          user_id: input.userId,
          document_type: input.documentType,
          queue_number: (latest?.queue_number ?? 0) + 1,
          notes: input.notes ?? null,
          proof_url: input.proofUrl ?? null,
        })
        .select(requestSelect)
        .single();

      if (error) throw error;
      return toRequest(data as RequestRow);
    },

    async findByUserId(userId: string) {
      const { data, error } = await client
        .from("requests")
        .select(requestSelect)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as RequestRow[]).map(toRequest);
    },

    async findAll() {
      const { data, error } = await client
        .from("requests")
        .select(requestSelect)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as RequestRow[]).map(toRequest);
    },

    async findActiveByUserAndType(
      userId: string,
      documentType: string,
    ): Promise<StudentRequest | null> {
      const { data, error } = await client
        .from("requests")
        .select(requestSelect)
        .eq("user_id", userId)
        .eq("document_type", documentType)
        .in("status", ["pending", "processing"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data ? toRequest(data as RequestRow) : null;
    },

    async countTodayByUser(userId: string): Promise<number> {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count, error } = await client
        .from("requests")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", today.toISOString());

      if (error) throw error;
      return count ?? 0;
    },

    async findLastByUser(
      userId: string,
    ): Promise<StudentRequest | null> {
      const { data, error } = await client
        .from("requests")
        .select(requestSelect)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data ? toRequest(data as RequestRow) : null;
    },

    async updateStatus(id: string, status: RequestStatus) {
      const { data, error } = await client
        .from("requests")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select(requestSelect)
        .single();

      if (error) throw error;
      return toRequest(data as RequestRow);
    },

    async findById(id: string): Promise<StudentRequest | null> {
      const { data, error } = await client
        .from("requests")
        .select(requestSelect)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data ? toRequest(data as RequestRow) : null;
    },

    async deleteById(id: string) {
      const { error } = await client.from("requests").delete().eq("id", id);
      if (error) throw error;
    },

    async updateNotesAndProof(
      id: string,
      input: { notes: string | null; proofUrl: string | null },
    ) {
      const { data, error } = await client
        .from("requests")
        .update({
          notes: input.notes,
          proof_url: input.proofUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select(requestSelect)
        .single();

      if (error) throw error;
      return toRequest(data as RequestRow);
    },
  };
}

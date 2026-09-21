import type { RequestStatus, StudentRequest } from "@/src/domain/request";
import { getSupabaseClient } from "@/src/infrastructure/supabase/supabase.client";

type RequestRow = {
  id: string;
  user_id: string;
  document_type: string;
  section: string | null;
  queue_number: number;
  status: RequestStatus;
  proof_url: string | null;
  notes: string | null;
  archived_at: string | null;
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
    section: row.section,
    queueNumber: row.queue_number,
    status: row.status,
    proofUrl: row.proof_url,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

const requestSelect =
  "id, user_id, document_type, section, queue_number, status, proof_url, notes, archived_at, created_at, updated_at, users(full_name, email)";

const REQUEST_RETRIES = 5;

export function createRequestRepository() {
  const client = getSupabaseClient();

  return {
    /**
     * Creates a request and assigns its queue number from the section's own
     * active queue: the next number is `max(queue_number) + 1` among the
     * section's non-archived requests. Every section starts at 1, and a section
     * never shares/borrows numbers from another section.
     *
     * The partial unique index `requests_active_section_queue_uq` makes the
     * (section, queue_number) pair unique within the active cycle, so if two
     * students submit at the same time the loser of a race errors with a unique
     * violation (Postgres code 23505) and we recompute + retry.
     */
    async create(input: {
      userId: string;
      documentType: string;
      section: string;
      notes?: string | null;
      proofUrl?: string | null;
    }) {
      for (let attempt = 0; attempt < REQUEST_RETRIES; attempt++) {
        // Next number for THIS section's current active cycle only.
        const { data: latest, error: latestError } = await client
          .from("requests")
          .select("queue_number")
          .eq("section", input.section)
          .is("archived_at", null)
          .order("queue_number", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (latestError) throw latestError;

        const { data, error } = await client
          .from("requests")
          .insert({
            user_id: input.userId,
            document_type: input.documentType,
            section: input.section,
            queue_number: (latest?.queue_number ?? 0) + 1,
            notes: input.notes ?? null,
            proof_url: input.proofUrl ?? null,
          })
          .select(requestSelect)
          .single();

        if (!error) return toRequest(data as RequestRow);

        // 23505 = unique_violation from racing another insert in the same
        // section: recompute the queue number and try again. Any other error is
        // a real failure.
        if (error.code !== "23505") throw error;
      }
      throw new Error("Could not assign a queue number. Try again.");
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

    /**
     * Requests currently being served. `archived_at` is null, so this is the
     * live admin queue; past cycles live in the archive (see findArchived).
     */
    async findAll() {
      const { data, error } = await client
        .from("requests")
        .select(requestSelect)
        .is("archived_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as RequestRow[]).map(toRequest);
    },

    /** Requests from completed queue cycles, newest archive first. */
    async findArchived() {
      const { data, error } = await client
        .from("requests")
        .select(requestSelect)
        .not("archived_at", "is", null)
        .order("archived_at", { ascending: false });

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
        .is("archived_at", null)
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

    /**
     * Completes the current queue cycle. Every active request is archived (gets
     * an `archived_at` timestamp) in one atomic UPDATE; nothing is deleted, so
     * records stay available under their section/date. The next request in any
     * section starts again at Queue 1 because its active queue is now empty.
     *
     * Every active row is archived regardless of section (a request whose
     * `section` is null is part of the cycle too), so this can never silently
     * no-op.
     */
    async archiveActiveQueue() {
      const { error } = await client
        .from("requests")
        .update({ archived_at: new Date().toISOString() })
        .is("archived_at", null);

      if (error) throw error;
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
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
  student_archived_at: string | null;
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
    studentArchivedAt: row.student_archived_at,
  };
}

const requestSelect =
  "id, user_id, document_type, section, queue_number, status, proof_url, notes, archived_at, student_archived_at, created_at, updated_at, users(full_name, email)";

const REQUEST_RETRIES = 5;

export function createRequestRepository() {
  const client = getSupabaseClient();

  /**
   * A section's queue cycle is only open while something is still waiting or
   * being processed. Once the last in-flight request is finished, completed
   * and rejected rows are just history: archive them before the next submission
   * so the new request starts at Queue 1 instead of continuing from numbers
   * that no longer represent work in the queue.
   *
   * This is deliberately lazy. If the registrar still has pending work, the
   * finished rows stay on the active dashboard until that work is done, so the
   * admin can review them without opening the archive.
   */
  async function resetIdleSection(section: string): Promise<void> {
    const { data, error } = await client
      .from("requests")
      .select("id")
      .eq("section", section)
      .is("archived_at", null)
      .in("status", ["pending", "processing"])
      .limit(1);

    if (error) throw error;
    if ((data ?? []).length > 0) return;

    const { error: archiveError } = await client
      .from("requests")
      .update({ archived_at: new Date().toISOString() })
      .eq("section", section)
      .is("archived_at", null)
      .in("status", ["completed", "rejected"]);

    if (archiveError) throw archiveError;
  }

  /**
   * Keeps a section's active queue numbers contiguous, in queue order.
   *
   * Queue numbers are per section and should read 1..N while a cycle is open.
   * Deleting a pending request, archiving finished rows, or moving a request to
   * another section can leave holes (e.g. 2, 3, 4). Updating rows in ascending
   * queue order is safe: every new value is <= the row's current value, so it
   * can only reuse a number freed by an earlier row, never collide with a row
   * that has not been processed yet.
   */
  async function compactSectionQueue(section: string): Promise<void> {
    const { data, error } = await client
      .from("requests")
      .select("id, queue_number")
      .eq("section", section)
      .is("archived_at", null)
      .order("queue_number", { ascending: true });

    if (error) throw error;

    const rows = (data ?? []) as { id: string; queue_number: number }[];
    for (let index = 0; index < rows.length; index++) {
      const nextNumber = index + 1;
      if (rows[index].queue_number === nextNumber) continue;

      const { error: updateError } = await client
        .from("requests")
        .update({ queue_number: nextNumber })
        .eq("id", rows[index].id)
        .is("archived_at", null);

      if (updateError) throw updateError;
    }
  }

  /**
   * Resets an idle cycle, compacts the section, then returns the next free
   * queue number.
   */
  async function nextQueueNumber(section: string): Promise<number> {
    await resetIdleSection(section);
    await compactSectionQueue(section);

    const { data, error } = await client
      .from("requests")
      .select("queue_number")
      .eq("section", section)
      .is("archived_at", null)
      .order("queue_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return (data?.queue_number ?? 0) + 1;
  }

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
        // Next number for THIS section's current active cycle only. The helper
        // also closes holes left by deleted/archived requests, so the active
        // queue always reads 1..N and a new request always goes to the back.
        const queueNumber = await nextQueueNumber(input.section);

        const { data, error } = await client
          .from("requests")
          .insert({
            user_id: input.userId,
            document_type: input.documentType,
            section: input.section,
            queue_number: queueNumber,
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

    /** Requests the student has not filed away from their dashboard. */
    async findVisibleByUserId(userId: string) {
      const { data, error } = await client
        .from("requests")
        .select(requestSelect)
        .eq("user_id", userId)
        .is("student_archived_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as RequestRow[]).map(toRequest);
    },

    /** Requests the student filed away, newest archive first. */
    async findStudentArchivedByUserId(userId: string) {
      const { data, error } = await client
        .from("requests")
        .select(requestSelect)
        .eq("user_id", userId)
        .not("student_archived_at", "is", null)
        .order("student_archived_at", { ascending: false });

      if (error) throw error;
      return (data as RequestRow[]).map(toRequest);
    },

    async archiveForStudent(id: string, userId: string) {
      const { data, error } = await client
        .from("requests")
        .update({ student_archived_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", userId)
        .in("status", ["completed", "rejected"])
        .select(requestSelect)
        .single();

      if (error) throw error;
      return toRequest(data as RequestRow);
    },

    async restoreForStudent(id: string, userId: string) {
      const { data, error } = await client
        .from("requests")
        .update({ student_archived_at: null })
        .eq("id", id)
        .eq("user_id", userId)
        .select(requestSelect)
        .single();

      if (error) throw error;
      return toRequest(data as RequestRow);
    },

    /**
     * Moves a student's pending requests into a corrected section and appends
     * them to that section's queue.
     *
     * Profile details are snapshotted onto a request when it is submitted, so a
     * student who notices a wrong section after submitting would otherwise be
     * stuck with it. Pending requests are still safe to move; processing and
     * finished requests keep the section they were submitted with.
     */
    async reassignPendingRequestsSection(
      userId: string,
      section: string,
    ): Promise<number> {
      const { data, error } = await client
        .from("requests")
        .select("id, section")
        .eq("user_id", userId)
        .eq("status", "pending")
        .is("archived_at", null)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const pending = (data ?? []) as { id: string; section: string | null }[];
      const oldSections = new Set<string>();
      let moved = 0;

      for (const request of pending) {
        if (request.section === section) continue;
        if (request.section) oldSections.add(request.section);

        for (let attempt = 0; attempt < REQUEST_RETRIES; attempt++) {
          const queueNumber = await nextQueueNumber(section);
          const { error: updateError } = await client
            .from("requests")
            .update({
              section,
              queue_number: queueNumber,
              updated_at: new Date().toISOString(),
            })
            .eq("id", request.id)
            .eq("status", "pending")
            .is("archived_at", null);

          if (!updateError) {
            moved += 1;
            break;
          }
          if (updateError.code !== "23505") throw updateError;
          if (attempt === REQUEST_RETRIES - 1) throw updateError;
        }
      }

      // The old sections lost rows; close any holes left behind.
      for (const oldSection of oldSections) {
        await compactSectionQueue(oldSection);
      }

      return moved;
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
        .in("status", ["pending", "processing"])
        .gte("created_at", today.toISOString());

      if (error) throw error;
      return count ?? 0;
    },

    async findLastByUser(userId: string): Promise<StudentRequest | null> {
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
    async archiveActiveQueue(): Promise<void> {
      const { data, error } = await client
        .from("requests")
        .update({ archived_at: new Date().toISOString() })
        .is("archived_at", null)
        .or("status.eq.completed,status.eq.rejected")
        .select("id, status");

      if (error) throw error;
      if (
        data?.some(
          (row) => row.status !== "completed" && row.status !== "rejected",
        )
      ) {
        throw new Error("An active request had an invalid archive status.");
      }

      // Finished rows are gone from the active cycle now, which can leave the
      // carried-over pending/processing requests with numbers like 3, 4. Bring
      // each affected section back to a contiguous 1..N queue.
      const { data: remaining, error: remainingError } = await client
        .from("requests")
        .select("section")
        .is("archived_at", null);
      if (remainingError) throw remainingError;

      const sections = new Set<string>();
      for (const row of remaining ?? []) {
        if (row.section) sections.add(row.section);
      }
      for (const section of sections) {
        await compactSectionQueue(section);
      }
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
      const { data: row, error: lookupError } = await client
        .from("requests")
        .select("section")
        .eq("id", id)
        .maybeSingle();
      if (lookupError) throw lookupError;

      const { error } = await client.from("requests").delete().eq("id", id);
      if (error) throw error;

      // Removing a pending request frees its queue number. Close the hole so
      // the students behind it move up instead of leaving a permanent gap.
      if (row?.section) await compactSectionQueue(row.section);
    },

    /** Deletes every request owned by a user. Returns the deleted count. */
    async deleteAllByUserId(userId: string): Promise<number> {
      const { count, error } = await client
        .from("requests")
        .delete({ count: "exact" })
        .eq("user_id", userId);

      if (error) throw error;
      return count ?? 0;
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

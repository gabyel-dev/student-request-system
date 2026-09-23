"use client";

import { useEffect, useRef, useState } from "react";
import type { StudentRequest, RequestStatus } from "@/src/domain/request";
import { getRealtimeSupabaseClient } from "@/src/infrastructure/supabase/supabase.browser";

// Raw database row as it arrives on a Realtime payload (snake_case, no join).
// Realtime sends the plain request row, so the student name/email (which the
// server query gets from the `users` join) has to be filled in via resolveUser.
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
};

// The pieces of a student profile the UI needs to display a request.
export type RealtimeUser = {
  fullName: string;
  email: string;
};

export type UseRealtimeRequestsOptions = {
  // Requests fetched on the server. They seed local state; Realtime keeps it fresh.
  initialRequests: StudentRequest[];
  // postgres_changes filter, e.g. "user_id=eq.<uuid>" for a student.
  // Leave undefined (admin dashboard) to receive every request row.
  filter?: string;
  // Resolves a user_id to student display info so INSERT/UPDATE rows can be
  // rendered. For admins this reads a map built from the students list; for a
  // student it always returns their own profile.
  resolveUser: (userId: string) => RealtimeUser | undefined;
};

/**
 * Keeps the dashboard's request list in sync with the database in real time.
 *
 * How it works:
 *  1. The server renders once with `initialRequests`.
 *  2. This hook opens a Supabase Realtime (WebSocket) channel on the "requests"
 *     table. Supabase pushes every change to this browser as it happens.
 *  3. Each event is applied to local state:
 *       INSERT  -> prepend the new request (newest first).
 *       UPDATE  -> replace that request with fresh values (e.g. status flips),
 *                  or remove it when the admin archived it (queue reset).
 *       DELETE  -> remove the request from the list.
 *
 * So when a student submits a request, it appears on the admin queue instantly,
 * and when an admin changes a status, the student's tracker updates instantly —
 * all without refreshing the page.
 *
 * Cleanup on unmount removes the channel so we don't leak WebSocket connections.
 */
export function useRealtimeRequests({
  initialRequests,
  filter,
  resolveUser,
}: UseRealtimeRequestsOptions): {
  requests: StudentRequest[];
  isLive: boolean;
} {
  const [requests, setRequests] = useState(initialRequests);
  // isLive = true once the WebSocket channel is joined and delivering events.
  const [isLive, setIsLive] = useState(false);

  // Keep the latest resolveUser in a ref so the subscription below is only
  // opened once, while every incoming event still calls the current resolver.
  const resolveUserRef = useRef(resolveUser);

  useEffect(() => {
    // Syncing the ref in an effect (not during render) satisfies the
    // react-hooks/refs rule: refs may not be written while rendering.
    resolveUserRef.current = resolveUser;
  }, [resolveUser]);

  useEffect(() => {
    const supabase = getRealtimeSupabaseClient();
    if (!supabase) return;

    // Guards against updating state after the component unmounted.
    let active = true;

    // Maps a raw Realtime row to the StudentRequest shape used by the UI.
    // Falls back to the student's last-known name/email (e.g. when a brand-new
    // student's profile hasn't reached `students` in the admin dashboard yet).
    function rowToRequest(
      row: RequestRow,
      fallback?: StudentRequest,
    ): StudentRequest {
      const user = resolveUserRef.current(row.user_id);
      return {
        id: row.id,
        userId: row.user_id,
        studentName:
          user?.fullName ?? fallback?.studentName ?? "Unknown student",
        studentEmail: user?.email ?? fallback?.studentEmail ?? "",
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

    // Subscribe to every change (INSERT / UPDATE / DELETE) on the requests table.
    // The `filter` limits what ROW changes this channel cares about — for
    // students that's their own user_id, for admins it's the whole table.
    const channel = supabase
      .channel("realtime-requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "requests", filter },
        (payload) => {
          if (!active) return;

          // DELETE events carry the removed row in `old`, everything else in `new`.
          const row = (payload.eventType === "DELETE"
            ? payload.old
            : payload.new) as RequestRow | null;
          if (!row) return;

          setRequests((current) => {
            switch (payload.eventType) {
              case "INSERT": {
                // Never show archived rows in the live queue, and guard against
                // a race where the row was already applied.
                if (row.archived_at) return current;
                if (current.some((request) => request.id === row.id)) {
                  return current;
                }
                // New submissions land on top (the list is newest-first).
                return [rowToRequest(row), ...current];
              }
              case "UPDATE": {
                // The admin completed the queue -> this row is now archived, so
                // it leaves the live queue and shows up in the archive instead.
                if (row.archived_at) {
                  return current.filter((request) => request.id !== row.id);
                }
                // Merge fresh DB values over the existing entry.
                const existing = current.find(
                  (request) => request.id === row.id,
                );
                return current.map((request) =>
                  request.id === row.id ? rowToRequest(row, existing) : request,
                );
              }
              case "DELETE": {
                return current.filter((request) => request.id !== row.id);
              }
              default:
                return current;
            }
          });
        },
      )
      .subscribe((status, error) => {
        // Status becomes "SUBSCRIBED" once the channel joins; from then on the
        // browser is receiving live changes.
        if (active) setIsLive(status === "SUBSCRIBED");
        if (error) {
          console.error("Realtime subscription error:", error);
          setIsLive(false);
        }
      });

    // Unsubscribe + close the WebSocket when the dashboard unmounts.
    return () => {
      active = false;
      setIsLive(false);
      void supabase.removeChannel(channel);
    };
  }, [filter]);

  return { requests, isLive };
}
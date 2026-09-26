"use client";

import { useMemo } from "react";
import { DashboardHeader } from "./dashboard-header";
import { HowItWorks } from "./how-it-works";
import { QuickActions } from "./quick-actions";
import { RecentActivity } from "./recent-activity";
import { RequestHero } from "./hero";
import { ScrollProgress } from "./scroll-progress";
import { StudentDetails } from "./student-details";
import { isInFlight } from "./status-pill";
import { useRealtimeRequests } from "../lib/use-realtime-requests";
import type { Student } from "../types";
import type { StudentRequest } from "@/src/domain/request";

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

/**
 * The student home, ordered by the one job it exists for: follow a request, and
 * start the next one.
 *
 *   hero          who and where the request stands, above the fold
 *   requests      what is in flight — the reason to come back to this page
 *   services      choose the document to request next
 *   how it works  what happens next, stated once
 *   strip         profile and totals, demoted to a reference bar
 *
 * The tracker used to sit below the services grid and the explainer. That made
 * the page read as a brochure that also had a list on it: a returning student
 * had to scroll past two sections of setup to reach the queue number they came
 * for. It is now second, directly under the hero.
 *
 * The hero owns the atmosphere and the request panel owns the elevation;
 * everything between them is deliberately quiet so those two read as the peaks.
 *
 * The page does not display the Realtime connection state. The hook stays
 * wired up because the list genuinely updates by itself, but a student cares
 * that their request moved, not which transport moved it.
 */
export function StudentDashboard({
  student,
  userId,
  requests: initialRequests,
}: {
  student: Student;
  userId: string;
  requests: StudentRequest[];
}) {
  // Realtime keeps this dashboard in sync with the student's own requests:
  // it seeds from the server-rendered list, then applies changes as they
  // happen (e.g. the registrar marks a request "completed" -> the tracker and
  // the hero's queue count update instantly).
  const resolveUser = useMemo(
    () => () => ({ fullName: student.name, email: student.email }),
    [student.name, student.email],
  );

  const { requests } = useRealtimeRequests({
    initialRequests,
    // Students only receive events for rows belonging to them.
    // (For admins, this filter is omitted so all requests come through.)
    filter: `user_id=eq.${userId}`,
    resolveUser,
  });

  // One pass for both figures, so the hero's summary and the tracker's split
  // can never disagree about what is in flight.
  const { active, completed, featured } = useMemo(() => {
    let activeCount = 0;
    let completedCount = 0;
    let newestOpen: StudentRequest | undefined;

    for (const request of requests) {
      if (request.status === "completed") completedCount += 1;
      if (!isInFlight(request.status) || request.archivedAt) continue;
      activeCount += 1;
      // Newest of the open ones, so the hero promotes the request a student
      // most likely came back for rather than whichever row landed first.
      if (
        !newestOpen ||
        Date.parse(request.createdAt) > Date.parse(newestOpen.createdAt)
      ) {
        newestOpen = request;
      }
    }

    return {
      active: activeCount,
      completed: completedCount,
      featured: newestOpen
        ? {
            queueNumber: newestOpen.queueNumber,
            documentType: newestOpen.documentType,
            status: newestOpen.status,
          }
        : undefined,
    };
  }, [requests]);

  return (
    <div className="flex flex-col gap-14 pt-14 lg:gap-16">
      <ScrollProgress />
      <DashboardHeader />

      <RequestHero
        firstName={getFirstName(student.name)}
        activeCount={active}
        featured={featured}
      />

      <RecentActivity requests={requests} />

      <QuickActions />
      <HowItWorks />

      <StudentDetails
        student={student}
        total={requests.length}
        active={active}
        completed={completed}
      />
    </div>
  );
}

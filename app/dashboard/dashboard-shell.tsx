"use client";

import { useCallback, useState } from "react";
import { Sidebar } from "./sidebar";
import { AdminDashboard } from "./admin/dashboard";
import { StudentDashboard } from "./student/dashboard";
import { SplashScreen } from "./student/splash-screen";

import type { Student } from "./types";
import type { StudentRequest } from "@/src/domain/request";
import type { User } from "@/src/domain/user";

export function DashboardShell({
  student,
  userId,
  requests,
  showSplash = false,
  adminData,
}: {
  student: Student;
  userId: string;
  requests: StudentRequest[];
  /**
   * Whether the student gets the itikQ splash. Resolved on the server from a
   * cookie so it is in the first paint. The admin console does not get one: it
   * is a tool people open mid-task, not a front door, and the same curtain
   * there would be pure friction.
   */
  showSplash?: boolean;
  adminData?: { requests: StudentRequest[]; students: User[] };
}) {
  // The splash dismisses itself, and the server cannot know that it did, so the
  // flag is dropped here as well. Without it the curtain would come back on the
  // next client-side navigation to the dashboard in the same session.
  const [splashDone, setSplashDone] = useState(false);
  const onSplashDone = useCallback(() => setSplashDone(true), []);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-ground text-ink">
      <Sidebar student={student} adminMode={Boolean(adminData)} />
      <div className="relative z-1 min-h-screen transition-[margin] duration-300 md:ml-[84px] lg:ml-60">
        <div className="mx-auto w-[calc(100%-32px)] max-w-295 py-6 sm:w-[calc(100%-42px)] sm:py-8 lg:w-[calc(100%-64px)] lg:py-12">
          {adminData ? (
            <AdminDashboard
              requests={adminData.requests}
              students={adminData.students}
            />
          ) : (
            <StudentDashboard
              student={student}
              userId={userId}
              requests={requests}
            />
          )}
        </div>
      </div>

      {/* A sibling of the content, not a child of it. The content wrapper is its
          own `z-1` stacking context, so a splash nested inside it could never
          rise above the sidebar's `z-50` drawer scrim no matter how high its own
          z-index went. Mounted here it competes with the sidebar directly. */}
      {showSplash && !splashDone && !adminData ? (
        <SplashScreen onDone={onSplashDone} />
      ) : null}
    </main>
  );
}

"use client";

import { Sidebar } from "./sidebar";
import { AdminDashboard } from "./admin/dashboard";
import { StudentDashboard } from "./student/dashboard";

import type { Student } from "./types";
import type { StudentRequest } from "@/src/domain/request";
import type { User } from "@/src/domain/user";

export function DashboardShell({
  student,
  userId,
  requests,
  adminData,
}: {
  student: Student;
  userId: string;
  requests: StudentRequest[];
  adminData?: { requests: StudentRequest[]; students: User[] };
}) {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#f2f6f3] text-[#14251d]">
      <Sidebar student={student} adminMode={Boolean(adminData)} />
      <div className="relative z-1 min-h-screen transition-[margin] duration-300 md:ml-[84px] lg:ml-60">
        <div className="mx-auto w-[calc(100%-32px)] max-w-295 py-6 sm:w-[calc(100%-42px)] sm:py-8 lg:w-[calc(100%-64px)] lg:py-12">
          {adminData ? (
            <AdminDashboard
              requests={adminData.requests}
              students={adminData.students}
            />
          ) : (
            <StudentDashboard student={student} userId={userId} requests={requests} />
          )}
        </div>
      </div>
    </main>
  );
}

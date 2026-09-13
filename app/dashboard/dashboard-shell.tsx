"use client";

import { useState } from "react";
import { FiBookOpen, FiClock, FiFileText, FiX } from "react-icons/fi";
import { DuckMascot } from "./duck-mascot";
import { Header } from "./header";
import { getFirstName } from "./helpers";
import { QuickActions } from "./quick-actions";
import { RecentActivity } from "./recent-activity";
import { Sidebar } from "./sidebar";
import { StatCard } from "./stat-card";
import { StudentDetails } from "./student-details";
import type { Student } from "./types";

export function DashboardShell({ student }: { student: Student }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const request = (service: string) =>
    setNotice(`Request flow ready for ${service}.`);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#eaf7f0] text-[#17392d]">
      <div
        className="fixed inset-0 z-0 bg-[linear-gradient(110deg,rgba(231,249,239,.96),rgba(241,250,245,.82)),url('/ptc-bg.webp')] bg-cover bg-center saturate-70 after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_78%_16%,rgba(170,229,195,.65),transparent_30%),radial-gradient(circle_at_45%_86%,rgba(196,241,215,.7),transparent_34%)]"
        aria-hidden="true"
      />
      <Sidebar
        mobileOpen={mobileOpen}
        collapsed={sidebarCollapsed}
        close={() => setMobileOpen(false)}
        toggleCollapsed={() => setSidebarCollapsed((collapsed) => !collapsed)}
      />
      {mobileOpen ? (
        <button
          className="fixed inset-0 z-[3] border-0 bg-[rgba(11,52,36,.28)] transition-opacity duration-200"
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        />
      ) : null}
      <div
        className={`relative z-[1] min-h-screen transition-[margin] duration-300 lg:ml-55 ${sidebarCollapsed ? "lg:ml-19" : ""}`}>
        <Header student={student} openMenu={() => setMobileOpen(true)} />
        <div className="mx-auto w-[calc(100%-32px)] max-w-295 py-6 sm:w-[calc(100%-42px)] sm:py-8 lg:w-[calc(100%-64px)] lg:py-12">
          <section className="relative flex min-h-51.25 items-start justify-between sm:min-h-42.5 sm:items-center">
            <div className="flex items-start gap-3 sm:items-center sm:gap-5.5">
              <img
                src="/logo.png"
                alt="Pateros Technological College seal"
                className="h-10.75 w-10.75 rounded-full object-contain drop-shadow-[0_8px_12px_rgba(39,104,71,.12)] sm:h-17.5 sm:w-17.5"
              />
              <div>
                <p className="m-0 text-[10px] font-extrabold uppercase tracking-[.15em] text-[#168b62]">
                  Welcome back to itikQ
                </p>
                <h1 className="mt-2 text-[30px] font-bold leading-[1.04] tracking-tighter sm:text-[clamp(31px,4vw,49px)]">
                  Hello, {getFirstName(student.name)}.<br />
                  <span className="font-medium text-[#628a78]">
                    How can we help today?
                  </span>
                </h1>
              </div>
            </div>
            <DuckMascot />
          </section>
          <div className="grid gap-2 sm:grid-cols-3 sm:gap-4">
            <StatCard
              icon={FiFileText}
              value="0"
              label="Total Requests"
              accent="green"
            />
            <StatCard
              icon={FiClock}
              value="0"
              label="In Progress"
              accent="orange"
            />
            <StatCard
              icon={FiBookOpen}
              value={student.section}
              label="Profile Overview"
              accent="blue"
            />
          </div>
          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(260px,.8fr)]">
            <QuickActions onRequest={request} />
            <StudentDetails student={student} />
          </div>
          <RecentActivity />
        </div>
      </div>
      {notice ? (
        <div className="fixed bottom-4 left-4 right-4 z-10 flex items-center justify-between gap-4 rounded-xl border border-[#b8ddc6] bg-[#f4fff7] px-4 py-3 text-xs text-[#17392d] shadow-[0_16px_35px_rgba(25,84,50,.16)] sm:bottom-6 sm:left-auto sm:right-6">
          <span role="status">{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss">
            <FiX />
          </button>
        </div>
      ) : null}
    </main>
  );
}

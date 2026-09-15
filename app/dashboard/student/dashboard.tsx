"use client";

import Link from "next/link";
import {
  FiArrowUpRight,
  FiCheckCircle,
  FiClock,
  FiLayers,
  FiPlus,
} from "react-icons/fi";
import { DuckMascot } from "./duck-mascot";
import { QuickActions } from "./quick-actions";
import { RecentActivity } from "./recent-activity";
import { StudentDetails } from "./student-details";
import type { Student } from "../types";
import type { StudentRequest } from "@/src/domain/request";

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function StudentDashboard({
  student,
  requests,
}: {
  student: Student;
  requests: StudentRequest[];
}) {
  const active = requests.filter(
    (request) =>
      request.status === "pending" || request.status === "processing",
  ).length;
  const completed = requests.filter(
    (request) => request.status === "completed",
  ).length;

  const overview = [
    {
      label: "Total requests",
      value: requests.length,
      icon: FiLayers,
      tilt: "dash-tilt--left",
    },
    { label: "Active in queue", value: active, icon: FiClock, tilt: "" },
    {
      label: "Completed",
      value: completed,
      icon: FiCheckCircle,
      tilt: "dash-tilt--right",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-8">
      <section className="dash-hero relative overflow-hidden rounded-tr-4xl rounded-bl-4xl shadow-[0_24px_60px_rgba(5,45,34,.16)]">
        <img
          src="/bg.webp"
          alt=""
          aria-hidden="true"
          className="dash-hero__texture pointer-events-none"
        />
        <div className="dash-hero__shade pointer-events-none" />
        <div className="dash-hero__wave dash-hero__wave--back" />
        <div className="dash-hero__wave dash-hero__wave--front" />
        <div className="dash-hero__blob dash-hero__blob--one" />
        <div className="dash-hero__blob dash-hero__blob--two" />

        <DuckMascot />

        <div className="relative z-10 px-4 py-6 sm:px-9 sm:py-12 lg:pr-52 lg:pl-12 xl:pr-60">
          <div className="dash-glass z-20 rounded-tr-3xl rounded-bl-3xl  dash-skew relative max-w-lg px-5 py-6 sm:px-8 sm:py-9">
            <span className="absolute -top-3.5 left-8 rounded-full border border-white/70 bg-[#087a54] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white shadow-[0_6px_14px_rgba(8,122,84,.35)]">
              Itik Q
            </span>
            <h1 className="text-[22px] font-bold leading-[1.12] tracking-[-0.045em] text-[#123b32] sm:text-[36px]">
              Hello, {getFirstName(student.name)}.
              <span className="block font-medium text-[#4a7a6a]">
                How can we help today?
              </span>
            </h1>
            <p className="mt-2 text-sm leading-5 text-[#52706a] sm:mt-3 sm:text-[15px] sm:leading-6">
              Start a new request, or follow along below as it moves through the
              queue.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2.5 sm:mt-6 sm:gap-3">
              <Link
                href="/request"
                className="group inline-flex items-center gap-2 rounded-full bg-[#087a54] px-5 py-2.5 text-[13px] font-bold text-white shadow-[0_10px_24px_rgba(8,122,84,.35)] transition hover:bg-[#066044] sm:px-6 sm:py-3 sm:text-sm">
                <FiPlus className="text-[14px] sm:text-[15px]" />
                Start a request
              </Link>
              <Link
                href="#requests"
                className="inline-flex items-center gap-2 rounded-full border border-[#0d6951]/25 bg-white/50 px-5 py-2.5 text-[13px] font-bold text-[#24574a] backdrop-blur transition hover:border-[#0d6951]/40 hover:bg-white/80 sm:px-6 sm:py-3 sm:text-sm">
                Track requests
                <FiArrowUpRight className="text-lg transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
      <div className="flex w-full flex-col gap-4 min-w-0  lg:flex-row md:items-stretch lg:gap-1">
        <section className="min-w-0">
          <section className="grid gap-1 grid-cols-1 md:grid-cols-1 lg:grid-cols-3 w-full pb-1">
            {overview.map(({ label, value, icon: Icon, tilt }, index) => (
              <div
                key={label}
                className={`dash-glass ${index === 0 ? "lg:rounded-tl-4xl" : ""} dash-tilt flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-5 sm:py-5 ${tilt}`}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#e3f5ee] to-[#cdeeda] text-[#087a54] sm:h-11 sm:w-11">
                  <Icon className="text-lg sm:text-xl" />
                </span>
                <span>
                  <strong className="block text-xl font-bold tabular-nums tracking-tight text-[#123b32] sm:text-2xl">
                    {value}
                  </strong>
                  <span className="text-[11px] font-semibold text-[#5d6f66] sm:text-xs">
                    {label}
                  </span>
                </span>
              </div>
            ))}
          </section>

          <QuickActions />
        </section>

        <RecentActivity requests={requests} />
      </div>

      <StudentDetails student={student} />
    </div>
  );
}

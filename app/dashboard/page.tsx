import { redirect } from "next/navigation";
import Link from "next/link";
import {
  FiArrowUpRight,
  FiBookOpen,
  FiClock,
  FiFileText,
  FiGrid,
  FiHelpCircle,
  FiPlus,
  FiUser,
} from "react-icons/fi";
import { getSessionTokenUserId } from "@/src/server/session";
import { userRepository } from "@/src/server/container";
import { LogoutButton } from "./logout-button";

export default async function DashboardPage() {
  const userId = await getSessionTokenUserId();
  if (!userId) {
    redirect("/login");
  }

  const user = await userRepository.findById(userId);
  if (!user) {
    redirect("/login");
  }

  if (!user.section || user.studentNumber === null) {
    redirect("/onboarding");
  }

  const firstName = user.fullName.split(" ")[0];
  const initials = user.fullName
    .split(" ")
    .slice(0, 2)
    .map((name) => name[0])
    .join("")
    .toUpperCase();

  return (
    <main className="min-h-screen w-full bg-[#f3f7f4] text-[#17392d]">
      <div className="mx-auto w-full flex h-screen sticky top-0 ">
        <aside className="hidden w-64 shrink-0 flex-col  h-screen sticky border-r border-[#dce9e1] bg-[#0c8f62] px-5 py-7 text-white lg:flex">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center bg-white text-lg font-black text-[#0c8f62]">
              P
            </div>
            <div>
              <p className="text-sm font-bold tracking-wide">PTC</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-100">
                Student portal
              </p>
            </div>
          </div>

          <nav className="mt-14 space-y-2" aria-label="Main navigation">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 bg-white/15 px-4 py-3 text-sm font-semibold">
              <FiGrid aria-hidden="true" /> Overview
            </Link>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-emerald-50 transition hover:bg-white/10">
              <FiFileText aria-hidden="true" /> My requests
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-emerald-50 transition hover:bg-white/10">
              <FiUser aria-hidden="true" /> My profile
            </button>
          </nav>

          <div className="mt-auto border-t border-white/20 pt-5">
            <button
              type="button"
              className="mb-4 flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-emerald-50 transition hover:bg-white/10">
              <FiHelpCircle aria-hidden="true" /> Help center
            </button>
            <LogoutButton />
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex items-center justify-between border-b border-[#dce9e1] bg-white px-5 py-4 sm:px-8 lg:px-12">
            <div className="lg:hidden">
              <p className="text-sm font-black text-[#0c8f62]">PTC</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#709082]">
                Student portal
              </p>
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0c8f62]">
                Student request system
              </p>
              <p className="mt-1 text-sm text-[#709082]">
                A clearer way to manage your campus requests.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-[#17392d]">
                  {user.fullName}
                </p>
                <p className="text-xs text-[#709082]">{user.email}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center bg-[#d7f0e4] text-sm font-bold text-[#0c8f62]">
                {initials}
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-medium text-[#709082]">
                  Good morning, {firstName}.
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#17392d] sm:text-4xl">
                  How can we help today?
                </h1>
              </div>
              <button
                type="button"
                className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#0c8f62] px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(12,143,98,0.2)] transition hover:bg-[#087650]">
                <FiPlus aria-hidden="true" /> Start a new request
              </button>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="border border-[#dce9e1] bg-white p-5">
                <div className="flex items-center justify-between">
                  <FiFileText className="text-[#0c8f62]" aria-hidden="true" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#98afa4]">
                    All time
                  </span>
                </div>
                <p className="mt-5 text-3xl font-bold text-[#17392d]">0</p>
                <p className="mt-1 text-sm text-[#709082]">Total requests</p>
              </div>
              <div className="border border-[#dce9e1] bg-white p-5">
                <div className="flex items-center justify-between">
                  <FiClock className="text-[#d28b36]" aria-hidden="true" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#98afa4]">
                    In progress
                  </span>
                </div>
                <p className="mt-5 text-3xl font-bold text-[#17392d]">0</p>
                <p className="mt-1 text-sm text-[#709082]">Awaiting action</p>
              </div>
              <div className="border border-[#dce9e1] bg-white p-5">
                <div className="flex items-center justify-between">
                  <FiBookOpen className="text-[#5b7bc4]" aria-hidden="true" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#98afa4]">
                    Profile
                  </span>
                </div>
                <p className="mt-5 truncate text-lg font-bold text-[#17392d]">
                  {user.section}
                </p>
                <p className="mt-1 text-sm text-[#709082]">
                  {user.studentNumber}
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
              <section className="border border-[#dce9e1] bg-white p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0c8f62]">
                      Quick start
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-[#17392d]">
                      Submit a campus request
                    </h2>
                    <p className="mt-2 max-w-lg text-sm leading-6 text-[#709082]">
                      Request documents, clearances, and other student services
                      without lining up at the office.
                    </p>
                  </div>
                  <div className="hidden h-12 w-12 items-center justify-center bg-[#e4f5ec] text-2xl text-[#0c8f62] sm:flex">
                    <FiArrowUpRight aria-hidden="true" />
                  </div>
                </div>
                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    className="border border-[#dce9e1] p-4 text-left transition hover:border-[#0c8f62] hover:bg-[#f3fbf7]">
                    <FiFileText className="text-[#0c8f62]" aria-hidden="true" />
                    <span className="mt-5 block text-sm font-bold">
                      Documents
                    </span>
                    <span className="mt-1 block text-xs text-[#709082]">
                      Certificates and records
                    </span>
                  </button>
                  <button
                    type="button"
                    className="border border-[#dce9e1] p-4 text-left transition hover:border-[#0c8f62] hover:bg-[#f3fbf7]">
                    <FiBookOpen className="text-[#0c8f62]" aria-hidden="true" />
                    <span className="mt-5 block text-sm font-bold">
                      Clearance
                    </span>
                    <span className="mt-1 block text-xs text-[#709082]">
                      Start a clearance request
                    </span>
                  </button>
                  <button
                    type="button"
                    className="border border-[#dce9e1] p-4 text-left transition hover:border-[#0c8f62] hover:bg-[#f3fbf7]">
                    <FiHelpCircle
                      className="text-[#0c8f62]"
                      aria-hidden="true"
                    />
                    <span className="mt-5 block text-sm font-bold">
                      Other help
                    </span>
                    <span className="mt-1 block text-xs text-[#709082]">
                      Ask the registrar
                    </span>
                  </button>
                </div>
              </section>

              <section className="border border-[#dce9e1] bg-[#17392d] p-6 text-white sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">
                  Your profile
                </p>
                <h2 className="mt-3 text-xl font-bold">Student details</h2>
                <dl className="mt-6 space-y-4 text-sm">
                  <div className="border-b border-white/15 pb-3">
                    <dt className="text-emerald-200/70">Student ID</dt>
                    <dd className="mt-1 font-semibold">{user.studentNumber}</dd>
                  </div>
                  <div className="border-b border-white/15 pb-3">
                    <dt className="text-emerald-200/70">Section</dt>
                    <dd className="mt-1 font-semibold">{user.section}</dd>
                  </div>
                  <div>
                    <dt className="text-emerald-200/70">Email</dt>
                    <dd className="mt-1 truncate font-semibold">
                      {user.email}
                    </dd>
                  </div>
                </dl>
                <button
                  type="button"
                  className="mt-7 text-sm font-bold text-emerald-300 underline decoration-emerald-300/40 underline-offset-4">
                  Review profile
                </button>
              </section>
            </div>

            <section className="mt-8 border border-[#dce9e1] bg-white p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0c8f62]">
                    Activity
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-[#17392d]">
                    Recent requests
                  </h2>
                </div>
                <span className="text-sm text-[#98afa4]">No history yet</span>
              </div>
              <div className="mt-8 flex flex-col items-center justify-center border-t border-dashed border-[#dce9e1] py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center bg-[#edf7f1] text-xl text-[#0c8f62]">
                  <FiFileText aria-hidden="true" />
                </div>
                <p className="mt-4 text-sm font-bold text-[#17392d]">
                  Your request history will appear here
                </p>
                <p className="mt-1 text-sm text-[#709082]">
                  Start a request when you need help from the campus office.
                </p>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

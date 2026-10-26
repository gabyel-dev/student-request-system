import Link from "next/link";
import { redirect } from "next/navigation";
import { FiChevronLeft } from "react-icons/fi";
import { isAdminEmail } from "@/src/infrastructure/auth/admin-accounts";
import { requestRepository, userRepository } from "@/src/server/container";
import { getSessionTokenUserId } from "@/src/server/session";
import { Sidebar } from "../sidebar";
import { StudentArchivePanel } from "./student-archive-panel";

export const revalidate = 60;

export default async function StudentArchivePage() {
  const userId = await getSessionTokenUserId();
  if (!userId) redirect("/login");

  const user = await userRepository.findById(userId);
  if (!user) redirect("/login");
  if (isAdminEmail(user.email)) redirect("/dashboard");
  if (!user.section || user.studentNumber === null) redirect("/onboarding");

  const archived = await requestRepository.findStudentArchivedByUserId(user.id);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-ground text-ink">
      <Sidebar
        student={{
          name: user.fullName,
          email: user.email,
          profilePictureUrl: user.profilePictureUrl,
          section: user.section,
          studentNumber: user.studentNumber,
        }}
      />
      <div className="relative z-1 min-h-screen transition-[margin] duration-300 md:ml-[84px] lg:ml-60">
        <div className="mx-auto w-[calc(100%-32px)] max-w-295 py-6 sm:w-[calc(100%-42px)] sm:py-8 lg:w-[calc(100%-64px)] lg:py-12">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#087a54] transition hover:opacity-70">
            <FiChevronLeft size={15} aria-hidden="true" />
          </Link>

          <header className="mt-6">
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-ink sm:text-4xl">
              Archived requests
            </h1>
          </header>

          <StudentArchivePanel archived={archived} />
        </div>
      </div>
    </main>
  );
}

import { redirect } from "next/navigation";
import { getSessionTokenUserId } from "@/src/server/session";
import { userRepository } from "@/src/server/container";
import { isAdminEmail } from "@/src/infrastructure/auth/admin-accounts";
import { Sidebar } from "../sidebar";

/**
 * Shared shell for admin-only sub-pages (Students, Archive). Keeps the same
 * sidebar + content frame as the main dashboard, but enforces the admin role
 * at the route level so the pages themselves don't repeat the guard.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getSessionTokenUserId();
  if (!userId) redirect("/login");

  const user = await userRepository.findById(userId);
  if (!user) redirect("/login");

  if (!isAdminEmail(user.email)) redirect("/dashboard");

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#f2f6f3] text-[#14251d]">
      <Sidebar
        student={{
          name: user.fullName,
          email: user.email,
          profilePictureUrl: user.profilePictureUrl,
          section: "Admin",
          studentNumber: user.studentNumber ?? "",
        }}
        adminMode
      />
      <div className="relative z-1 min-h-screen transition-[margin] duration-300 md:ml-[84px] lg:ml-60">
        <div className="mx-auto w-[calc(100%-32px)] max-w-295 py-6 sm:w-[calc(100%-42px)] sm:py-8 lg:w-[calc(100%-64px)] lg:py-12">
          {children}
        </div>
      </div>
    </main>
  );
}
import { redirect } from "next/navigation";
import { getSessionTokenUserId } from "@/src/server/session";
import { userRepository } from "@/src/server/container";
import { isAdminEmail } from "@/src/infrastructure/auth/admin-accounts";
import { Sidebar } from "../sidebar";

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
    <main className="min-h-screen overflow-x-clip bg-[#F6F7F6] text-[#17211B]">
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
      {/* Matches the sidebar: 76px icon rail on md, 240px full sidebar on lg. */}
      <div className="md:pl-[76px] lg:pl-60">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          {children}
        </div>
      </div>
    </main>
  );
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionTokenUserId } from "@/src/server/session";
import { userRepository } from "@/src/server/container";
import { DashboardShell } from "./dashboard-shell";
import { isAdminEmail } from "@/src/infrastructure/auth/admin-accounts";
import { requestRepository } from "@/src/server/container";
import { SPLASH_COOKIE } from "@/src/lib/auth/splash-cookie";

export default async function DashboardPage() {
  const userId = await getSessionTokenUserId();
  if (!userId) {
    redirect("/login");
  }

  const user = await userRepository.findById(userId);
  if (!user) {
    redirect("/login");
  }

  const admin = isAdminEmail(user.email);
  if (!admin && (!user.section || user.studentNumber === null)) {
    redirect("/onboarding");
  }

  const requests = admin
    ? await requestRepository.findAll()
    : await requestRepository.findByUserId(user.id);
  const students = admin
    ? (await userRepository.findAll()).filter(
        (student) => !isAdminEmail(student.email),
      )
    : [];

  // Decided here rather than in the student dashboard so the splash is part of
  // the server-rendered HTML. See the note on SPLASH_COOKIE: a splash added
  // after hydration covers a dashboard the student has already started reading.
  const splashSeen = (await cookies()).get(SPLASH_COOKIE)?.value === "1";

  return (
    <DashboardShell
      student={{
        name: user.fullName,
        email: user.email,
        profilePictureUrl: user.profilePictureUrl,
        section: user.section ?? "Admin",
        studentNumber: user.studentNumber ?? "",
      }}
      requests={requests}
      userId={user.id}
      showSplash={!splashSeen}
      adminData={admin ? { requests, students } : undefined}
    />
  );
}

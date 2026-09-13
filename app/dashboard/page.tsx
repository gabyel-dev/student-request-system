import { redirect } from "next/navigation";
import { getSessionTokenUserId } from "@/src/server/session";
import { userRepository } from "@/src/server/container";
import { DashboardShell } from "./dashboard-shell";

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

  return (
    <DashboardShell
      student={{
        name: user.fullName,
        email: user.email,
        profilePictureUrl: user.profilePictureUrl,
        section: user.section,
        studentNumber: user.studentNumber,
      }}
    />
  );
}

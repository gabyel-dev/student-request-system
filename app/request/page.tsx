import { redirect } from "next/navigation";
import { isAdminEmail } from "@/src/infrastructure/auth/admin-accounts";
import { requestRepository, userRepository } from "@/src/server/container";
import { getSessionTokenUserId } from "@/src/server/session";
import { BackToDashboard, ServiceOptions } from "./service-options";

export default async function RequestIndexPage() {
  const userId = await getSessionTokenUserId();
  if (!userId) redirect("/login");

  const user = await userRepository.findById(userId);
  if (!user) redirect("/login");
  if (isAdminEmail(user.email)) redirect("/dashboard");
  if (!user.section || user.studentNumber === null) redirect("/onboarding");

  const requests = await requestRepository.findByUserId(userId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = requests.filter(
    (r) => new Date(r.createdAt).getTime() >= today.getTime(),
  ).length;
  const remaining = 5 - todayCount;

  return (
    <main className="min-h-screen bg-[#f2f6f3] text-[#14251d]">
      <div className="mx-auto w-[calc(100%-32px)] max-w-3xl py-6 sm:w-[calc(100%-42px)] sm:py-8 lg:w-[calc(100%-64px)] lg:py-10">
        <BackToDashboard />
        <section className="mt-6">
          <h1 className="mt-2 text-2xl font-bold tracking-[-.03em] sm:text-3xl">
            Choose a service
          </h1>
          <p className="mt-1 text-sm text-[#5d6f66]">
            Select what you need and we will send it to the registrar.
          </p>
          {remaining <= 2 && remaining > 0 && (
            <p className="mt-2 text-xs text-[#b07b17]">
              {remaining} request{remaining === 1 ? "" : "s"} remaining today.
            </p>
          )}
          {remaining <= 0 && (
            <p className="mt-2 text-xs text-[#b0423c]">
              You have used all 5 requests for today. Try again tomorrow.
            </p>
          )}
        </section>
        <ServiceOptions />
      </div>
    </main>
  );
}

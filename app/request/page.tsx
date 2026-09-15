import Link from "next/link";
import { redirect } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import { services } from "@/app/dashboard/data";
import { isAdminEmail } from "@/src/infrastructure/auth/admin-accounts";
import { requestRepository, userRepository } from "@/src/server/container";
import { getSessionTokenUserId } from "@/src/server/session";

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
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#087a54] transition hover:opacity-70">
          <FiArrowLeft /> Back to dashboard
        </Link>
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
        <div className="mt-6 grid sm:grid-cols-2 sm:gap-x-12">
          {services.map(({ slug, title, description, icon: Icon }) => (
            <Link
              key={slug}
              href={`/request/${slug}`}
              className="group flex items-start gap-3 border-b border-[#dbebe3] py-5 text-left transition hover:bg-white/60 sm:py-6">
              <Icon className="mt-0.5 shrink-0 text-[#087a54]" />
              <span>
                <strong className="block text-sm text-[#14251d] transition-colors group-hover:text-[#087a54]">
                  {title}
                </strong>
                <span className="mt-0.5 block text-xs text-[#5d6f66]">
                  {description}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

import { redirect } from "next/navigation";
import { isAdminEmail } from "@/src/infrastructure/auth/admin-accounts";
import { requestRepository, userRepository } from "@/src/server/container";
import { getSessionTokenUserId } from "@/src/server/session";
import { BackToDashboard, ServiceOptions } from "./service-options";

const DAILY_LIMIT = 5;

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
  const remaining = DAILY_LIMIT - todayCount;

  return (
    <main className="min-h-screen bg-sunken text-ink">
      <div
        aria-hidden="true"
        className="h-1 bg-gradient-to-r from-accent via-accent/50 to-transparent"
      />
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <BackToDashboard />

        <header className="mt-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
            New request
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-ink sm:text-4xl">
            Choose a service
          </h1>
          <p className="mt-2 max-w-[52ch] text-[15px] leading-7 text-muted">
            Select what you need and we&rsquo;ll send it to the registrar.
            You&rsquo;ll get a queue number right away.
          </p>
        </header>

        <DailyAllowance used={todayCount} remaining={remaining} />

        <section aria-label="Available services" className="mt-6">
          <ServiceOptions />
        </section>
      </div>
    </main>
  );
}

/**
 * The student's daily request allowance, visualized as five dots. The card
 * tints amber when the allowance runs low and red when it's spent, so the
 * state reads at a glance instead of hiding in a sentence.
 */
function DailyAllowance({
  used,
  remaining,
}: {
  used: number;
  remaining: number;
}) {
  const exhausted = remaining <= 0;
  const low = !exhausted && remaining <= 2;

  return (
    <div
      className={`mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border p-4 sm:p-5 ${
        exhausted
          ? "border-rejected/30 bg-rejected-soft"
          : low
            ? "border-pending/30 bg-pending-soft"
            : "border-hairline bg-surface"
      }`}>
      <div className="min-w-0">
        <p className="mt-1 text-sm font-semibold text-ink">
          {exhausted ? (
            <>You&rsquo;ve used all {DAILY_LIMIT} requests for today.</>
          ) : (
            <>
              <span className="font-mono tabular-nums">{remaining}</span> of{" "}
              {DAILY_LIMIT} requests remaining
            </>
          )}
        </p>
        {exhausted ? (
          <p className="mt-0.5 text-[13px] text-muted">Try again tomorrow.</p>
        ) : low ? (
          <p className="mt-0.5 text-[13px] text-muted">
            Choose carefully — the count resets at midnight.
          </p>
        ) : null}
      </div>
      <div
        className="ml-auto flex items-center gap-1.5"
        role="img"
        aria-label={`${used} of ${DAILY_LIMIT} requests used today`}>
        {Array.from({ length: DAILY_LIMIT }).map((_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`h-2.5 w-2.5 rounded-full transition-colors ${
              i < used ? "bg-accent" : "bg-hairline"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

import Image from "next/image";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";
import { getSessionTokenUserId } from "@/src/server/session";
import { userRepository } from "@/src/server/container";

export default async function OnboardingPage() {
  const userId = await getSessionTokenUserId();
  if (!userId) redirect("/login");

  const user = await userRepository.findById(userId);
  if (!user) redirect("/login");

  return (
    <main className="h-screen w-full bg-[#eef7f1]  text-[#17392d]  ">
      <section className="mx-auto grid h-screen w-full overflow-hidden rounded-tr-3xl rounded-bl-3xl border border-white/70 bg-[rgba(247,255,251,.94)] shadow-[18px_24px_80px_rgba(0,0,0,.5)] backdrop-blur lg:grid-cols-[1fr_0.9fr]">
        <div className="px-6 py-8 sm:px-12 sm:py-12 lg:px-16 lg:py-16">
          <h1 className="mt-5 max-w-md text-4xl font-semibold leading-tight tracking-tight text-[#17392d] sm:text-5xl">
            Let&apos;s complete your student profile.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-[#5d786b]">
            Add these details once so your requests reach the right class and
            student record.
          </p>
          <ProfileForm
            section={user.section ?? ""}
            studentNumber={user.studentNumber ?? ""}
          />
        </div>
        <div className="relative min-h-64 lg:min-h-full">
          <Image
            src="/ptc-bg.webp"
            alt="Pateros Technological College campus"
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1023px) 100vw, 45vw"
          />
          <div className="absolute inset-0 bg-[#075c42]/25" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#073c2d]/80 to-transparent p-6 pt-24 text-white sm:p-10 sm:pt-32">
            <p className="text-sm font-semibold tracking-wide">
              Pateros Technological College
            </p>
            <p className="mt-2 text-sm text-white/80">
              Your campus, your requests, one place.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

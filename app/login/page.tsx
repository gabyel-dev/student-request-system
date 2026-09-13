import { redirect } from "next/navigation";
import Image from "next/image";
import { Manrope } from "next/font/google";

import { GoogleSignInButton } from "@/app/auth/google-sign-in-button";
import { getSessionTokenUserId } from "@/src/server/session";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export default async function LoginPage() {
  const userId = await getSessionTokenUserId();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main
      className={`relative min-h-screen w-full overflow-hidden bg-[#09201e] ${manrope.variable}`}
      style={{ fontFamily: "var(--font-manrope)" }}>
      <div className="mobile-login relative  h-screen flex min-h-screen flex-col overflow-hidden md:hidden">
        <img
          src="/bg.webp"
          alt=""
          aria-hidden="true"
          className="mobile-login__texture absolute inset-0 h-full w-full object-cover"
        />
        <div className="mobile-login__blob mobile-login__blob--one" />
        <div className="mobile-login__blob mobile-login__blob--two" />

        <header className="mobile-login__header relative z-10 min-h-[200px] h-[300px] shrink-0 overflow-hidden px-7 pt-8 text-white">
          <div className="mobile-login__wave mobile-login__wave--back" />
          <div className="mobile-login__wave mobile-login__wave--middle" />
          <div className="mobile-login__wave mobile-login__wave--front" />
          <img
            src="/_logo_white.png"
            alt="Pateros Technological College"
            className="relative z-10 h-auto w-44 object-contain object-left -ml-5"
          />
        </header>

        <section className="relative z-20 flex flex-1 flex-col items-start px-7 pb-10 pt-8">
          <Image
            src="/logo.png"
            alt="Pateros Technological College seal"
            width={96}
            height={96}
            className="h-[82px] w-[82px] rounded-full object-contain shadow-[0_8px_18px_rgba(5,64,45,0.22)]"
          />
          <div className="mt-5 text-left">
            <h1 className="text-[32px] font-bold leading-tight tracking-[-0.045em] text-[#123b32]">
              Welcome, Student
            </h1>
            <p className="mt-2 max-w-[280px] text-sm leading-5 text-[#52706a]">
              Sign in with your school Google account to continue.
            </p>
          </div>

          <div className="mt-7 flex w-full max-w-[370px] justify-start">
            <GoogleSignInButton />
          </div>

          <p className="mt-5 max-w-[330px] text-left text-[11px] leading-4 text-[#5c7771]">
            Only school accounts ending in
            <br />
            <span className="font-semibold text-[#24574a]">
              @paterostechnologicalcollege.edu.ph
            </span>{" "}
            are allowed.
          </p>
        </section>

        <footer className="mobile-login__footer relative z-10 flex min-h-[86px] items-end justify-center px-5 pb-5 text-center">
          <p className="relative z-10 text-[11px] font-medium tracking-wide text-white/90">
            <span className="underline underline-offset-2">Terms</span> and{" "}
            <span className="underline underline-offset-2">Conditions</span> and{" "}
            <span className="underline underline-offset-2">Privacy Policy</span>
          </p>
        </footer>
      </div>

      <div className="desktop-login hidden md:block">
        <div className="desktop-login__backdrop absolute inset-0 h-screen min-h-0 w-full overflow-hidden">
          <img
            src="/bg.webp"
            alt="Pateros Technological College campus"
            className="desktop-login__texture relative z-1 h-screen w-full object-cover"
          />
          <div className="desktop-login__shade absolute inset-0 z-2" />
          <div className="desktop-login__blob desktop-login__blob--one" />
          <div className="desktop-login__blob desktop-login__blob--two" />
          <div className="desktop-login__wave desktop-login__wave--back" />
          <div className="desktop-login__wave desktop-login__wave--front" />
          <div className="absolute left-0 top-0 z-20 w-full px-12 pt-10">
            <img
              src="/_logo_white.png"
              alt="Pateros Technological College"
              className="h-auto w-56"
            />
          </div>
        </div>

        <div className="relative z-10 flex h-screen min-h-0 w-full flex-col overflow-visible bg-transparent">
          <section className="desktop-login__card flex z-4 flex-1 flex-col justify-center px-6 sm:px-10 md:mx-auto md:my-auto md:flex-none md:w-full md:max-w-md md:px-10 md:py-10">
            <Image
              src="/logo.png"
              alt="Pateros Technological College logo"
              width={96}
              height={96}
              className="h-20 w-20 object-contain"
            />
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-[#123b32]">
              Welcome, Student
            </h1>
            <p className="mt-2 max-w-sm text-sm leading-6 text-[#52706a]">
              Sign in with your school Google account to continue.
            </p>

            <div className="mt-8 flex cursor-pointer justify-center sm:justify-start">
              <GoogleSignInButton />
            </div>

            <p className="mt-6 text-xs leading-5 text-[#5c7771]">
              Only school accounts ending in
              <br />
              <span className="font-medium text-[#24574a]">
                @paterostechnologicalcollege.edu.ph
              </span>{" "}
              are allowed.
            </p>
          </section>

          <footer className="desktop-login__footer flex items-center justify-center px-6 py-3 md:absolute md:bottom-0 md:left-1/2 md:w-full md:-translate-x-1/2">
            <p className="text-sm font-medium text-white/90">
              <span className="cursor-pointer underline">Terms</span> and{" "}
              <span className="cursor-pointer underline">Conditions</span> and{" "}
              <span className="cursor-pointer underline">Privacy Policy.</span>
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}

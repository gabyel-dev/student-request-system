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
      className={`relative  flex h-screen w-full flex-col overflow-hidden bg-[#09201e] ${manrope.variable}`}
      style={{ fontFamily: "var(--font-manrope)" }}>
      <div className="relative  md:block h-1/2 min-h-0 w-full md:absolute md:inset-0 md:h-full">
        <img
          src="/bg.webp"
          alt="Pateros Technological College campus"
          className=" object-cover z-1 relative w-full h-screen"
        />
        <div className="absolute z-2 inset-0 bg-[#09201e]/55" />
        <div className="absolute z-2  inset-x-0 bottom-0 p-8 text-white md:hidden">
          <p className="text-sm z-2  font-semibold uppercase tracking-[0.16em] text-emerald-100">
            Pateros Technological College
          </p>
          <p className="mt-3 max-w-sm text-2xl font-semibold leading-tight">
            Student requests, all in one place.
          </p>
        </div>
      </div>

      <div className="flex z-2 h-screen min-h-0 w-full flex-col overflow-y-auto bg-[#e8e8e8]/95 md:relative md:z-10 md:h-screen md:overflow-visible md:bg-transparent">
        <section className="flex z-4 flex-1 flex-col justify-center px-6 sm:px-10 md:mx-auto md:my-auto md:flex-none md:w-full md:max-w-md md:bg-[#e8e8e8] md:px-10 md:py-10 md:shadow-2xl">
          <Image
            src="/logo.png"
            alt="Pateros Technological College logo"
            width={96}
            height={96}
            className="h-20 w-20 object-contain"
          />
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900">
            Welcome, Student
          </h1>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
            Sign in with your school Google account to continue.
          </p>

          <div className="mt-8 flex cursor-pointer justify-center sm:justify-start">
            <GoogleSignInButton />
          </div>

          <p className="mt-6 text-xs leading-5 text-slate-400">
            Only school accounts ending in
            <br />
            <span className="font-medium text-slate-600">
              @paterostechnologicalcollege.edu.ph
            </span>{" "}
            are allowed.
          </p>
        </section>

        <footer className="flex items-center justify-center bg-emerald-600 md:bg-transparent px-6 py-3 md:absolute md:bottom-0 md:left-1/2 md:w-full md:-translate-x-1/2">
          <p className="text-sm font-medium text-slate-100">
            <span className="cursor-pointer underline">Terms</span> and{" "}
            <span className="cursor-pointer underline">Conditions</span> and{" "}
            <span className="cursor-pointer underline">Privacy Policy.</span>
          </p>
        </footer>
      </div>
    </main>
  );
}

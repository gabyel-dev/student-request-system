import Link from "next/link";
import { services } from "../data";

export function QuickActions() {
  return (
    <section className="dash-glass relative overflow-hidden px-4 py-5 sm:px-8 sm:py-7 lg:rounded-bl-4xl ">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-56 w-56  opacity-70 blur-2xl"
        aria-hidden="true"
      />
      <div className="relative flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="mt-1 text-xl font-bold tracking-[-.035em] text-[#123b32]">
            Services
          </h2>
        </div>
      </div>

      <div className="relative mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:grid-cols-3 sm:gap-2.5">
        {services.map(({ slug, title, description, icon: Icon }) => (
          <Link
            href={`/request/${slug}`}
            key={slug}
            className="group flex flex-col rounded-2xl border border-[#dde8e1] bg-white p-3.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#c4d8cb] hover:shadow-md sm:min-h-28">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#edf6f1] text-[#0f7d56] transition-colors group-hover:bg-[#087a54] group-hover:text-white">
              <Icon />
            </span>
            <strong className="mt-3.5 block text-xs text-[#1f3a2e]">
              {title}
            </strong>
            <span className="mt-1 block text-[10px] leading-4 text-[#6d8478]">
              {description}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

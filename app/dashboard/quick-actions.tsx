import { FiFileText, FiPlus } from "react-icons/fi";
import { services } from "./data";

type QuickActionsProps = { onRequest: (service: string) => void };

export function QuickActions({ onRequest }: QuickActionsProps) {
  return (
    <section className="rounded-2xl border border-white/80 bg-white/65 p-5 shadow-[0_16px_40px_rgba(35,97,63,.08)] backdrop-blur-[18px] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="m-0 text-[10px] font-extrabold uppercase tracking-[.15em] text-[#168b62]">
            Campus services
          </p>
          <h2 className="mt-1.5 text-xl font-bold tracking-[-.035em]">
            Quick Actions
          </h2>
        </div>
        <span className="text-[10px] text-[#8aa79a]">06 services</span>
      </div>
      <button
        className="mt-5 flex w-full items-center justify-between rounded-xl border-0 bg-linear-to-r from-[#087a54] to-[#27a874] px-5 py-4 text-[13px] font-bold text-white shadow-[0_10px_20px_rgba(13,128,84,.2)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_24px_rgba(13,128,84,.25)]"
        type="button"
        onClick={() => onRequest("a new request")}>
        <span className="flex items-center gap-2">
          <FiPlus /> Start a new request
        </span>
        <FiFileText />
      </button>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {services.map(({ title, description, icon: Icon }) => (
          <button
            className="min-h-28 rounded-xl border border-[#5d927733] bg-white/45 p-3 text-left transition hover:-translate-y-0.5 hover:border-[#168b6280] hover:bg-white/85 hover:shadow-[0_8px_16px_rgba(35,97,63,.08)]"
            type="button"
            key={title}
            onClick={() => onRequest(title)}>
            <span className="block w-6 text-[#168b62]">
              <Icon />
            </span>
            <strong className="mt-4 block text-xs">{title}</strong>
            <span className="mt-1 block text-[10px] text-[#709082]">
              {description}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

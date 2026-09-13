import { FiFileText } from "react-icons/fi";

export function RecentActivity() {
  return (
    <section className="mt-4 rounded-2xl border border-white/80 bg-white/65 p-5 shadow-[0_16px_40px_rgba(35,97,63,.08)] backdrop-blur-[18px] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="m-0 text-[10px] font-extrabold uppercase tracking-[.15em] text-[#168b62]">
            Your timeline
          </p>
          <h2 className="mt-1.5 text-xl font-bold tracking-[-.035em]">
            Recent Activity
          </h2>
        </div>
        <span className="text-[10px] text-[#8aa79a]">No activity</span>
      </div>
      <div className="mt-5 grid place-items-center border-t border-dashed border-[#5d927733] py-9 text-center">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e1f5e8] text-[#168b62]">
          <FiFileText />
        </span>
        <strong className="mt-3 text-[13px]">No recent activity</strong>
        <p className="mt-1 text-[11px] text-[#709082]">
          Submitted requests and status updates will appear here.
        </p>
      </div>
    </section>
  );
}

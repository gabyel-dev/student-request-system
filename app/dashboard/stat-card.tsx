import type { IconType } from "react-icons";

type StatCardProps = {
  icon: IconType;
  value: string;
  label: string;
  accent: string;
};

export function StatCard({ icon: Icon, value, label, accent }: StatCardProps) {
  const accentClass =
    {
      green: "bg-[#d8f4e2] text-[#168b62]",
      orange: "bg-[#f8ead5] text-[#c9893f]",
      blue: "bg-[#e0eaf5] text-[#5978a1]",
    }[accent] ?? "bg-[#d8f4e2] text-[#168b62]";

  return (
    <article className="grid grid-cols-[42px_1fr] items-center gap-x-3 rounded-2xl border border-white/80 bg-white/65 p-4 shadow-[0_16px_40px_rgba(35,97,63,.08)] backdrop-blur-[18px] sm:p-5">
      <div
        className={`row-span-2 grid h-10 w-10 place-items-center rounded-xl ${accentClass}`}>
        <Icon />
      </div>
      <strong className="text-xl tracking-[-.04em] sm:text-2xl">{value}</strong>
      <span className="text-[11px] text-[#709082]">{label}</span>
    </article>
  );
}

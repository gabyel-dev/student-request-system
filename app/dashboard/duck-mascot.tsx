export function DuckMascot() {
  return (
    <div
      className="relative h-[174px] w-[280px] animate-bounce max-lg:origin-right max-lg:scale-80 max-lg:-mr-2.5 max-sm:absolute max-sm:right-0 max-sm:top-[128px] max-sm:w-[220px] max-sm:scale-65"
      aria-label="Friendly itikQ duck mascot"
      role="img">
      <div className="absolute left-0 top-[46px] z-[2] rounded-[14px] border-[1.5px] border-[#17392d] bg-white/90 px-4 py-2.5 text-xs font-bold leading-[1.4] text-[#17392d] shadow-[0_8px_18px_rgba(29,78,51,.09)] after:absolute after:-right-2 after:bottom-2 after:h-3.5 after:w-3.5 after:rotate-45 after:border-r-[1.5px] after:border-t-[1.5px] after:border-[#17392d] after:bg-white">
        Let&apos;s manage your
        <br />
        campus requests!
      </div>
      <img
        src="/pose_1.png"
        alt="Green itikQ duck mascot wearing a cap and making a peace sign"
        className="absolute bottom-0 right-0 h-[166px] w-[166px] object-contain [image-rendering:pixelated] drop-shadow-[0_12px_12px_rgba(30,90,57,.16)]"
      />
    </div>
  );
}

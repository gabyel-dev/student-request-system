export function DuckMascot() {
  return (
    <>
      <div
        className="pointer-events-none absolute right-4 -top-0 z-40 w-22 opacity-95 sm:w-20 md:hidden"
        aria-label="Friendly itikQ duck mascot"
        role="img">
        <img
          src="/pose_2.png"
          alt="Green itikQ duck mascot wearing a cap and making a peace sign"
          className="h-auto w-full object-contain drop-shadow-[0_10px_10px_rgba(30,90,57,.22)]"
        />
      </div>
      <div
        className="pointer-events-none absolute bottom-0 right-0 hidden w-44 opacity-90 md:block lg:w-52 xl:w-60"
        aria-label="Friendly itikQ duck mascot"
        role="img">
        <img
          src="/pose_2.png"
          alt="Green itikQ duck mascot wearing a cap and making a peace sign"
          className="h-auto w-full object-contain drop-shadow-[0_14px_14px_rgba(30,90,57,.2)]"
        />
      </div>
    </>
  );
}

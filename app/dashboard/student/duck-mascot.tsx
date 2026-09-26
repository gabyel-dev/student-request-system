/**
 * The itikQ duck mascot.
 *
 * Three placements, because the three callers want different things:
 * - `overlay` (default, used by the admin hero): two absolutely positioned
 *   copies, one for small screens and one for `md` and up.
 * - `inline`: a single image sized for the flow of a section. Used by the
 *   student requesting hero, where the mascot is a companion beside the
 *   headline rather than a backdrop behind it.
 * - `splash`: one large centred image. Used by the splash screen, where the
 *   mascot is the subject of the frame rather than an element in it.
 */
export function DuckMascot({
  placement = "overlay",
  size = "md",
}: {
  placement?: "overlay" | "inline" | "splash";
  size?: "sm" | "md" | "lg";
}) {
  const alt =
    "itikQ, the itikQ duck mascot, wearing a cap and making a peace sign";

  if (placement === "splash") {
    return (
      <img
        src="/pose_2.png"
        alt={alt}
        className="h-auto w-36 select-none object-contain drop-shadow-[0_22px_34px_rgba(0,0,0,.4)] sm:w-48 lg:w-56"
        draggable={false}
      />
    );
  }

  if (placement === "inline") {
    // `lg` is also used as a corner overlay on phones, where it has to stay
    // small enough to sit beside the copy instead of covering it.
    const width = {
      sm: "w-20 sm:w-24",
      md: "w-28 sm:w-36",
      lg: "w-20 sm:w-40 lg:w-52",
    }[size];
    return (
      <img
        src="/pose_2.png"
        alt={alt}
        className={`h-auto ${width} select-none object-contain drop-shadow-[0_18px_28px_rgba(0,0,0,.35)]`}
        draggable={false}
      />
    );
  }

  return (
    <>
      <div
        className="pointer-events-none absolute right-4 -top-0 z-40 w-22 opacity-95 sm:w-20 md:hidden"
        aria-hidden="true">
        <img
          src="/pose_2.png"
          alt={alt}
          className="h-auto w-full object-contain drop-shadow-[0_10px_10px_rgba(30,90,57,.22)]"
          draggable={false}
        />
      </div>
      <div
        className="pointer-events-none absolute bottom-0 right-0 hidden w-44 opacity-90 md:block lg:w-52 xl:w-60"
        aria-hidden="true">
        <img
          src="/pose_2.png"
          alt={alt}
          className="h-auto w-full object-contain drop-shadow-[0_14px_14px_rgba(30,90,57,.2)]"
          draggable={false}
        />
      </div>
    </>
  );
}

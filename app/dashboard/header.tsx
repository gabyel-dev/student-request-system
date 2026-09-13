import { FiMenu, FiMoreHorizontal } from "react-icons/fi";
import { getInitials } from "./helpers";
import type { Student } from "./types";

type HeaderProps = { student: Student; openMenu: () => void };

export function Header({ student, openMenu }: HeaderProps) {
  return (
    <header className="flex min-h-[74px] items-center justify-between border-b border-[#5d927733] bg-[#fafffc95] px-5 py-4 backdrop-blur-[18px] sm:min-h-[86px] sm:px-8 lg:px-16">
      <button
        className="grid border-0 bg-transparent text-[#17392d] sm:hidden"
        type="button"
        onClick={openMenu}
        aria-label="Open navigation">
        <FiMenu />
      </button>

      <div className="flex items-center gap-3">
        <div className="hidden gap-1 text-right sm:grid">
          <strong className="text-[13px]">{student.name}</strong>
          <span className="text-[10px] text-[#709082]">{student.email}</span>
        </div>
        {student.profilePictureUrl ? (
          <img
            src={student.profilePictureUrl}
            alt={`${student.name} profile`}
            className="h-10 w-10 rounded-full border border-white/80 object-cover"
          />
        ) : (
          <span className="grid h-10 w-10 place-items-center rounded-full border border-white/80 bg-[#d8f1e3] text-xs font-extrabold text-[#168b62]">
            {getInitials(student.name)}
          </span>
        )}
        <button
          type="button"
          className="hidden border-0 bg-transparent text-[#17392d]"
          aria-label="Profile menu">
          <FiMoreHorizontal />
        </button>
      </div>
    </header>
  );
}

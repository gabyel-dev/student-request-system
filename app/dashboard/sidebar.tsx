import Link from "next/link";
import {
  FiFileText,
  FiChevronLeft,
  FiChevronRight,
  FiGrid,
  FiHelpCircle,
  FiLogOut,
  FiUser,
} from "react-icons/fi";
import { LogoutButton } from "./logout-button";

type SidebarProps = {
  mobileOpen: boolean;
  collapsed: boolean;
  close: () => void;
  toggleCollapsed: () => void;
};

export function Sidebar({
  mobileOpen,
  collapsed,
  close,
  toggleCollapsed,
}: SidebarProps) {
  return (
    <aside
      className={`group fixed left-0 top-0 z-[4] flex h-screen flex-col overflow-hidden bg-linear-to-br from-[#087a54] to-[#15966b] px-[18px] py-[38px] text-[#f5fff9] shadow-[14px_0_40px_rgba(20,91,62,.12)] transition-[width,padding,transform] duration-300 max-lg:w-[76px] max-lg:items-center max-lg:px-2.5 max-lg:py-[30px] max-sm:-left-[230px] max-sm:w-[220px] max-sm:items-stretch max-sm:px-[18px] max-sm:py-[30px] ${mobileOpen ? "max-sm:left-0" : ""} ${collapsed ? "lg:w-[76px] lg:items-center lg:px-2.5 lg:py-[30px]" : "lg:w-[220px]"} ${collapsed ? "lg:hover:w-[220px] lg:hover:items-stretch lg:hover:px-[18px] lg:hover:py-[38px]" : ""}`}>
      <div
        className={`relative flex items-center gap-2 ${collapsed ? "justify-center lg:group-hover:justify-start" : ""}`}>
        <img
          src="/_logo_white.png"
          alt="itikQ - Pateros Technological College"
          className={`block h-auto object-contain transition-[width] duration-300 ${collapsed ? "w-[52px] lg:group-hover:w-[166px]" : "w-[166px]"}`}
        />
      </div>
      <button
        className={`absolute z-[1] grid h-7 w-7 place-items-center rounded-lg border border-white/25 bg-white/10 text-[#e5faed] transition hover:scale-105 hover:bg-white/20 max-lg:hidden ${collapsed ? "right-6 top-[82px] lg:group-hover:right-3.5 lg:group-hover:top-8" : "right-3.5 top-8"}`}
        type="button"
        onClick={toggleCollapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-pressed={collapsed}>
        {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
      </button>
      <nav
        className={`mt-12 grid gap-2 transition-opacity duration-200 max-sm:mt-12 ${collapsed ? "invisible pointer-events-none opacity-0 lg:group-hover:visible lg:group-hover:pointer-events-auto lg:group-hover:opacity-100" : ""}`}
        aria-label="Main navigation">
        <Link
          className={`flex w-full items-center gap-3 rounded-[10px] bg-white/90 px-3.5 py-3 text-left text-[13px] text-[#17392d] shadow-[0_7px_18px_rgba(13,75,49,.13)] transition hover:translate-x-0.5 hover:bg-white max-lg:justify-center max-lg:px-3 max-lg:text-[0px] max-sm:justify-start max-sm:px-3.5 max-sm:text-[13px] ${collapsed ? "lg:justify-center lg:px-3 lg:text-[0px] lg:group-hover:justify-start lg:group-hover:px-3.5 lg:group-hover:text-[13px]" : ""}`}
          href="/dashboard"
          onClick={close}>
          <FiGrid /> Overview
        </Link>
        <button
          className={`flex w-full items-center gap-3 rounded-[10px] border-0 bg-transparent px-3.5 py-3 text-left text-[13px] text-[#d5f3e3] transition hover:translate-x-0.5 hover:bg-white/15 max-lg:justify-center max-lg:px-3 max-lg:text-[0px] max-sm:justify-start max-sm:px-3.5 max-sm:text-[13px] ${collapsed ? "lg:justify-center lg:px-3 lg:text-[0px] lg:group-hover:justify-start lg:group-hover:px-3.5 lg:group-hover:text-[13px]" : ""}`}
          type="button"
          onClick={close}>
          <FiFileText /> My requests
        </button>
        <button
          className={`flex w-full items-center gap-3 rounded-[10px] border-0 bg-transparent px-3.5 py-3 text-left text-[13px] text-[#d5f3e3] transition hover:translate-x-0.5 hover:bg-white/15 max-lg:justify-center max-lg:px-3 max-lg:text-[0px] max-sm:justify-start max-sm:px-3.5 max-sm:text-[13px] ${collapsed ? "lg:justify-center lg:px-3 lg:text-[0px] lg:group-hover:justify-start lg:group-hover:px-3.5 lg:group-hover:text-[13px]" : ""}`}
          type="button"
          onClick={close}>
          <FiUser /> My profile
        </button>
      </nav>
      <div
        className={`mt-auto grid gap-2 border-t border-white/20 pt-[18px] transition-opacity duration-200 max-sm:mt-auto ${collapsed ? "invisible pointer-events-none opacity-0 lg:group-hover:visible lg:group-hover:pointer-events-auto lg:group-hover:opacity-100" : ""}`}>
        <button
          className={`flex w-full items-center gap-3 rounded-[10px] border-0 bg-transparent px-3.5 py-3 text-left text-[13px] text-[#d5f3e3] transition hover:translate-x-0.5 hover:bg-white/15 max-lg:justify-center max-lg:px-3 max-lg:text-[0px] max-sm:justify-start max-sm:px-3.5 max-sm:text-[13px] ${collapsed ? "lg:justify-center lg:px-3 lg:text-[0px] lg:group-hover:justify-start lg:group-hover:px-3.5 lg:group-hover:text-[13px]" : ""}`}
          type="button">
          <FiHelpCircle /> Help center
        </button>
        <div
          className={`flex items-center gap-3 px-3.5 py-3 text-[#d5f3e3] max-lg:justify-center max-lg:px-0 max-lg:text-[0px] max-sm:justify-start max-sm:px-3.5 max-sm:text-[13px] ${collapsed ? "lg:justify-center lg:px-0 lg:text-[0px] lg:group-hover:justify-start lg:group-hover:px-3.5 lg:group-hover:text-[13px]" : ""}`}>
          <FiLogOut />
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}

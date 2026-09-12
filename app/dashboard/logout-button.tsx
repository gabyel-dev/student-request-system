"use client";

import { useState } from "react";
import { logout } from "@/app/actions/auth";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await logout();
    // Hard navigation: fully reload the page so the browser re-reads the
    // cleared cookies and drops any stale client-side auth state. A soft
    // client-side navigation would keep the previous React/cookie state.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/login";
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleLogout}
      className="rounded-full border border-black/10 px-5 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10 disabled:opacity-50">
      {loading ? "Logging out..." : "Log out"}
    </button>
  );
}

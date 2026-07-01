"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPanel() {
  const router = useRouter();
  const [exportMode, setExportMode] = useState<"today" | "custom">("today");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function handleExport() {
    let url = "/api/export?mode=" + exportMode;
    if (exportMode === "custom") {
      if (!fromDate || !toDate) {
        alert("Please select both start and end dates.");
        return;
      }
      url += `&from=${fromDate}&to=${toDate}`;
    }
    window.location.href = url;
  }

  return (
    <div className="space-y-4">
      {/* Export section */}
      <div>
        <p className="text-xs text-[var(--cream-300)] mb-2">Export History</p>
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setExportMode("today")}
            className={`flex-1 rounded-md py-1.5 text-sm border transition-colors ${
              exportMode === "today"
                ? "bg-[var(--brass-500)] text-[var(--ink)] border-[var(--brass-500)] font-semibold"
                : "border-[var(--brass-500)]/30 text-[var(--cream-300)] hover:bg-white/5"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setExportMode("custom")}
            className={`flex-1 rounded-md py-1.5 text-sm border transition-colors ${
              exportMode === "custom"
                ? "bg-[var(--brass-500)] text-[var(--ink)] border-[var(--brass-500)] font-semibold"
                : "border-[var(--brass-500)]/30 text-[var(--cream-300)] hover:bg-white/5"
            }`}
          >
            Custom Range
          </button>
        </div>

        {exportMode === "custom" && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className="block text-xs text-[var(--cream-300)] mb-1">From</label>
              <input
                type="date"
                className="w-full text-sm"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--cream-300)] mb-1">To</label>
              <input
                type="date"
                className="w-full text-sm"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
        )}

        <button
          onClick={handleExport}
          className="w-full rounded-md py-2 bg-[var(--felt-700)] border border-[var(--brass-500)]/30 text-[var(--cream-100)] text-sm hover:bg-[var(--felt-800)] transition-colors"
        >
          ⬇ Download Excel (.xlsx)
        </button>
      </div>

      <div className="brass-line" />

      {/* Logout */}
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full rounded-md py-2 border border-[var(--red-felt)]/60 text-[#e69aa6] text-sm hover:bg-[var(--red-felt)]/20 transition-colors disabled:opacity-60"
      >
        {loggingOut ? "Signing out…" : "Sign Out"}
      </button>
    </div>
  );
}

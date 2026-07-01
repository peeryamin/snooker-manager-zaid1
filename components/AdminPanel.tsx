"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ADMIN_PASSWORD = "Zaid990340";

export default function AdminPanel() {
  const router = useRouter();
  const [exportMode, setExportMode] = useState<"today" | "custom">("today");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  // Hard reset state
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function handleExport() {
    let url = "/api/export?mode=" + exportMode;
    if (exportMode === "custom") {
      if (!fromDate || !toDate) { alert("Please select both start and end dates."); return; }
      url += `&from=${fromDate}&to=${toDate}`;
    }
    window.location.href = url;
  }

  async function handleReset() {
    setResetError("");
    setResetting(true);
    const res = await fetch("/api/admin/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: resetPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      setResetError(data.error || "Incorrect password");
      setResetting(false);
      return;
    }
    setResetSuccess(true);
    setShowResetConfirm(false);
    setResetting(false);
    setResetPassword("");
    setTimeout(() => setResetSuccess(false), 4000);
  }

  return (
    <div className="space-y-5">
      {/* Export */}
      <div>
        <p className="text-xs font-semibold text-[var(--cream-300)] mb-2 uppercase tracking-wider">Export History</p>
        <div className="flex gap-2 mb-3">
          {(["today", "custom"] as const).map(m => (
            <button key={m} onClick={() => setExportMode(m)}
              className={`flex-1 rounded-md py-1.5 text-sm border transition-colors ${exportMode === m ? "bg-[var(--brass-500)] text-[var(--ink)] border-[var(--brass-500)] font-semibold" : "border-[var(--brass-500)]/30 text-[var(--cream-300)] hover:bg-white/5"}`}>
              {m === "today" ? "Today" : "Custom Range"}
            </button>
          ))}
        </div>
        {exportMode === "custom" && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className="block text-xs text-[var(--cream-300)] mb-1">From</label>
              <input type="date" className="w-full text-sm" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-[var(--cream-300)] mb-1">To</label>
              <input type="date" className="w-full text-sm" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
          </div>
        )}
        <button onClick={handleExport}
          className="w-full rounded-md py-2 bg-[var(--felt-700)] border border-[var(--brass-500)]/30 text-[var(--cream-100)] text-sm hover:bg-[var(--felt-800)] transition-colors">
          ⬇ Download Excel (.xlsx)
        </button>
      </div>

      <div className="brass-line" />

      {/* Hard Reset */}
      <div>
        <p className="text-xs font-semibold text-[var(--cream-300)] mb-1 uppercase tracking-wider">Danger Zone</p>
        <p className="text-xs text-[var(--cream-300)]/50 mb-3">Hard reset wipes all sessions, bills, and food orders permanently.</p>

        {resetSuccess && (
          <div className="mb-3 p-2 rounded-md bg-emerald-900/30 border border-emerald-700/40 text-emerald-300 text-xs">
            ✓ All data has been reset successfully.
          </div>
        )}

        {!showResetConfirm ? (
          <button onClick={() => setShowResetConfirm(true)}
            className="w-full rounded-md py-2 border border-[var(--red-felt)]/60 text-[#e69aa6] text-sm hover:bg-[var(--red-felt)]/20 transition-colors">
            ⚠ Hard Reset Everything
          </button>
        ) : (
          <div className="space-y-2 p-3 rounded-lg border border-[var(--red-felt)]/40 bg-[var(--red-felt)]/10">
            <p className="text-xs text-[#e69aa6] font-semibold">Enter admin password to confirm reset:</p>
            <input
              type="password"
              className="w-full text-sm"
              placeholder="Admin password"
              value={resetPassword}
              onChange={e => setResetPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleReset()}
            />
            {resetError && <p className="text-xs text-[#e69aa6]">{resetError}</p>}
            <div className="flex gap-2">
              <button onClick={() => { setShowResetConfirm(false); setResetPassword(""); setResetError(""); }}
                className="flex-1 rounded-md py-1.5 text-xs border border-white/20 text-[var(--cream-300)] hover:bg-white/5">
                Cancel
              </button>
              <button onClick={handleReset} disabled={resetting}
                className="flex-1 rounded-md py-1.5 text-xs bg-[var(--red-felt)] text-white font-semibold hover:opacity-90 disabled:opacity-60">
                {resetting ? "Resetting…" : "Confirm Reset"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="brass-line" />

      {/* Logout */}
      <button onClick={handleLogout} disabled={loggingOut}
        className="w-full rounded-md py-2 border border-[var(--brass-500)]/30 text-[var(--cream-300)] text-sm hover:bg-white/5 transition-colors disabled:opacity-60">
        {loggingOut ? "Signing out…" : "Sign Out"}
      </button>
    </div>
  );
}

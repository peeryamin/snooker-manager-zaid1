"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SessionRow } from "@/lib/types";
import TableCard from "@/components/TableCard";
import PendingBills from "@/components/PendingBills";
import HistoryPanel from "@/components/HistoryPanel";
import AdminPanel from "@/components/AdminPanel";

type Tab = "sessions" | "pending" | "history" | "admin";

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("sessions");
  const [activeSessions, setActiveSessions] = useState<SessionRow[]>([]);
  const [pendingBills, setPendingBills] = useState<SessionRow[]>([]);
  const [history, setHistory] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [activeRes, pendingRes, historyRes] = await Promise.all([
      fetch("/api/sessions/active"),
      fetch("/api/bills/pending"),
      fetch("/api/history"),
    ]);
    if (activeRes.status === 401) { router.push("/login"); return; }
    const [activeData, pendingData, historyData] = await Promise.all([
      activeRes.json(),
      pendingRes.json(),
      historyRes.json(),
    ]);
    setActiveSessions(activeData.sessions || []);
    setPendingBills(pendingData.bills || []);
    setHistory(historyData.history || []);
    setLoading(false);
  }, [router]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-refresh every 15s
  useEffect(() => {
    const t = setInterval(fetchAll, 15000);
    return () => clearInterval(t);
  }, [fetchAll]);

  const table1Session = activeSessions.find((s) => s.table_no === 1) || null;
  const table2Session = activeSessions.find((s) => s.table_no === 2) || null;

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "sessions", label: "Tables" },
    { id: "pending", label: "Pending Bills", badge: pendingBills.length || undefined },
    { id: "history", label: "Today's History", badge: history.length || undefined },
    { id: "admin", label: "Admin" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--brass-500)]/15">
        <div>
          <p className="font-mono-score text-[10px] tracking-[0.3em] text-[var(--brass-400)] uppercase">
            Cue &amp; Ledger
          </p>
          <h1 className="font-display text-xl font-bold text-[var(--cream-100)]">
            Snooker Parlor
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {activeSessions.some((s) => s.status === "running") && (
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          )}
          <span className="text-xs text-[var(--cream-300)]">
            {activeSessions.filter((s) => s.status === "running").length} live
          </span>
        </div>
      </header>

      {/* Tabs */}
      <nav className="flex border-b border-[var(--brass-500)]/15 px-4 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeTab === t.id
                ? "border-[var(--brass-500)] text-[var(--brass-400)] font-semibold"
                : "border-transparent text-[var(--cream-300)] hover:text-[var(--cream-100)]"
            }`}
          >
            {t.label}
            {t.badge ? (
              <span className="bg-[var(--brass-500)] text-[var(--ink)] text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {t.badge}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-[var(--brass-400)] font-mono-score text-sm animate-pulse">
              Loading…
            </div>
          </div>
        ) : (
          <>
            {activeTab === "sessions" && (
              <div className="grid sm:grid-cols-2 gap-4">
                <TableCard tableNo={1} session={table1Session} onRefresh={fetchAll} />
                <TableCard tableNo={2} session={table2Session} onRefresh={fetchAll} />
              </div>
            )}

            {activeTab === "pending" && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="font-display text-lg font-bold">Pending Bills</h2>
                  <div className="brass-line flex-1" />
                </div>
                <PendingBills bills={pendingBills} onRefresh={fetchAll} />
              </div>
            )}

            {activeTab === "history" && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="font-display text-lg font-bold">Today&apos;s History</h2>
                  <div className="brass-line flex-1" />
                </div>
                <HistoryPanel history={history} />
              </div>
            )}

            {activeTab === "admin" && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="font-display text-lg font-bold">Admin</h2>
                  <div className="brass-line flex-1" />
                </div>
                <div className="table-felt rounded-xl p-5 max-w-sm">
                  <AdminPanel />
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SessionRow } from "@/lib/types";
import TableCard from "@/components/TableCard";
import PendingBills from "@/components/PendingBills";
import HistoryPanel from "@/components/HistoryPanel";
import AdminPanel from "@/components/AdminPanel";
import FoodOnlySection from "@/components/FoodOnlySection";

const COLLECTION_PASSWORD = "Zaid990340";

type Tab = "sessions" | "pending" | "history" | "food" | "admin";

interface FoodOrder {
  id: number;
  customer_name: string;
  items: string;
  amount: number;
  created_at: string;
}

interface Stats {
  total: number;
  session_revenue: number;
  food_revenue: number;
  session_count: number;
  food_order_count: number;
}

function CollectionWidget() {
  const [revealed, setRevealed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleReveal() {
    setError("");
    if (password !== COLLECTION_PASSWORD) {
      setError("Incorrect password");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/stats/today");
    const data = await res.json();
    setStats(data);
    setRevealed(true);
    setShowPrompt(false);
    setPassword("");
    setLoading(false);
  }

  return (
    <div className="table-felt rounded-xl p-4 flex flex-col items-center gap-2 border border-[var(--brass-500)]/20">
      <p className="font-mono-score text-[10px] tracking-widest text-[var(--brass-400)] uppercase">Today&apos;s Collection</p>

      {!revealed ? (
        <>
          <div className="flex gap-1 text-2xl select-none" onClick={() => setShowPrompt(true)} style={{ cursor: "pointer" }}>
            {"★★★★★".split("").map((s, i) => (
              <span key={i} className="text-[var(--brass-500)] hover:text-[var(--brass-400)] transition-colors">{s}</span>
            ))}
          </div>
          {!showPrompt ? (
            <button onClick={() => setShowPrompt(true)}
              className="text-[10px] text-[var(--brass-400)]/70 hover:text-[var(--brass-400)] transition-colors underline underline-offset-2">
              View today&apos;s collection
            </button>
          ) : (
            <div className="w-full space-y-2 mt-1">
              <input
                type="password"
                className="w-full text-sm"
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleReveal()}
                autoFocus
              />
              {error && <p className="text-xs text-[#e69aa6]">{error}</p>}
              <div className="flex gap-2">
                <button onClick={() => { setShowPrompt(false); setPassword(""); setError(""); }}
                  className="flex-1 rounded-md py-1 text-xs border border-white/10 text-[var(--cream-300)] hover:bg-white/5">
                  Cancel
                </button>
                <button onClick={handleReveal} disabled={loading}
                  className="flex-1 rounded-md py-1 text-xs bg-[var(--brass-500)] text-[var(--ink)] font-semibold hover:bg-[var(--brass-400)] disabled:opacity-60">
                  {loading ? "…" : "View"}
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        stats && (
          <div className="w-full space-y-2">
            <div className="text-center">
              <p className="font-mono-score text-3xl font-bold text-[var(--brass-400)]">₹{stats.total.toFixed(0)}</p>
              <p className="text-xs text-[var(--cream-300)] mt-0.5">Total collected today</p>
            </div>
            <div className="brass-line" />
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div>
                <p className="font-mono-score text-sm text-[var(--cream-100)]">₹{stats.session_revenue.toFixed(0)}</p>
                <p className="text-[var(--cream-300)]/60">{stats.session_count} sessions</p>
              </div>
              <div>
                <p className="font-mono-score text-sm text-[var(--cream-100)]">₹{stats.food_revenue.toFixed(0)}</p>
                <p className="text-[var(--cream-300)]/60">{stats.food_order_count} food orders</p>
              </div>
            </div>
            <button onClick={() => { setRevealed(false); setStats(null); }}
              className="w-full text-[10px] text-[var(--cream-300)]/40 hover:text-[var(--cream-300)]/70 transition-colors">
              Hide
            </button>
          </div>
        )
      )}
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("sessions");
  const [activeSessions, setActiveSessions] = useState<SessionRow[]>([]);
  const [pendingBills, setPendingBills] = useState<SessionRow[]>([]);
  const [history, setHistory] = useState<SessionRow[]>([]);
  const [foodOrders, setFoodOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [activeRes, pendingRes, historyRes, foodRes] = await Promise.all([
      fetch("/api/sessions/active"),
      fetch("/api/bills/pending"),
      fetch("/api/history"),
      fetch("/api/food-only"),
    ]);
    if (activeRes.status === 401) { router.push("/login"); return; }
    const [activeData, pendingData, historyData, foodData] = await Promise.all([
      activeRes.json(),
      pendingRes.json(),
      historyRes.json(),
      foodRes.json(),
    ]);
    setActiveSessions(activeData.sessions || []);
    setPendingBills(pendingData.bills || []);
    setHistory(historyData.history || []);
    setFoodOrders(foodData.orders || []);
    setLoading(false);
  }, [router]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => {
    const t = setInterval(fetchAll, 15000);
    return () => clearInterval(t);
  }, [fetchAll]);

  const table1Session = activeSessions.find(s => s.table_no === 1) || null;
  const table2Session = activeSessions.find(s => s.table_no === 2) || null;

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "sessions", label: "Tables" },
    { id: "pending", label: "Pending Bills", badge: pendingBills.length || undefined },
    { id: "history", label: "History", badge: history.length || undefined },
    { id: "food", label: "Food Orders", badge: foodOrders.length || undefined },
    { id: "admin", label: "Admin" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-[var(--brass-500)]/15">
        <div>
          <p className="font-mono-score text-[9px] tracking-[0.3em] text-[var(--brass-400)] uppercase">Cue &amp; Ledger</p>
          <h1 className="font-display text-lg font-bold text-[var(--cream-100)]">Snooker Parlor</h1>
        </div>
        <CollectionWidget />
      </header>

      {/* Tabs */}
      <nav className="flex border-b border-[var(--brass-500)]/15 px-3 overflow-x-auto gap-0.5">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-3 text-xs whitespace-nowrap border-b-2 transition-colors ${
              activeTab === t.id
                ? "border-[var(--brass-500)] text-[var(--brass-400)] font-semibold"
                : "border-transparent text-[var(--cream-300)] hover:text-[var(--cream-100)]"
            }`}>
            {t.label}
            {t.badge ? (
              <span className="bg-[var(--brass-500)] text-[var(--ink)] text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {t.badge}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <p className="text-[var(--brass-400)] font-mono-score text-sm animate-pulse">Loading…</p>
          </div>
        ) : (
          <>
            {activeTab === "sessions" && (
              <div className="grid sm:grid-cols-2 gap-5">
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
                <HistoryPanel history={history} onRefresh={fetchAll} />
              </div>
            )}

            {activeTab === "food" && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="font-display text-lg font-bold">Food-Only Orders</h2>
                  <div className="brass-line flex-1" />
                </div>
                <p className="text-sm text-[var(--cream-300)]/60 mb-4">
                  For customers who eat but don&apos;t play. Bills go straight to history.
                </p>
                <FoodOnlySection orders={foodOrders} onRefresh={fetchAll} />
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

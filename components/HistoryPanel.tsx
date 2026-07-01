"use client";

import { useState } from "react";
import { SessionRow } from "@/lib/types";

function EditHistoryModal({ session, onClose, onSaved }: { session: SessionRow; onClose: () => void; onSaved: () => void }) {
  const [loser, setLoser] = useState<"player1" | "player2">(session.loser ?? "player1");
  const [food1, setFood1] = useState(String(Number(session.food_charge_player1) || 0));
  const [food2, setFood2] = useState(String(Number(session.food_charge_player2) || 0));
  const [tableCharge, setTableCharge] = useState(String(Number(session.table_charge) || 0));
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    await fetch(`/api/history/${session.id}/edit`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loser, food_charge_player1: Number(food1), food_charge_player2: Number(food2), table_charge: Number(tableCharge) }),
    });
    onSaved();
    onClose();
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="table-felt rounded-xl p-5 w-full max-w-sm shadow-2xl space-y-4">
        <h3 className="font-display text-lg font-bold">Edit History #{session.id}</h3>
        <div>
          <label className="block text-xs text-[var(--cream-300)] mb-1">Who lost?</label>
          <div className="grid grid-cols-2 gap-2">
            {(["player1", "player2"] as const).map((p) => (
              <button key={p} type="button" onClick={() => setLoser(p)}
                className={`rounded-md py-2 text-sm border ${loser === p ? "bg-[var(--brass-500)] text-[var(--ink)] border-[var(--brass-500)] font-semibold" : "border-[var(--brass-500)]/40 hover:bg-white/5"}`}>
                {p === "player1" ? session.player1_name : session.player2_name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs text-[var(--cream-300)] mb-1">Table Charge (₹)</label>
          <input type="number" min="0" className="w-full" value={tableCharge} onChange={e => setTableCharge(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[var(--cream-300)] mb-1">{session.player1_name} food (₹)</label>
            <input type="number" min="0" className="w-full" value={food1} onChange={e => setFood1(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-[var(--cream-300)] mb-1">{session.player2_name} food (₹)</label>
            <input type="number" min="0" className="w-full" value={food2} onChange={e => setFood2(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-md border border-[var(--brass-500)]/40 text-[var(--cream-300)] hover:bg-white/5">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="px-4 py-2 rounded-md bg-[var(--brass-500)] text-[var(--ink)] font-semibold hover:bg-[var(--brass-400)] disabled:opacity-60">
            {loading ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function HistoryRow({ s, onRefresh }: { s: SessionRow; onRefresh: () => void }) {
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const tableCharge = Number(s.table_charge) || 0;
  const food1 = Number(s.food_charge_player1) || 0;
  const food2 = Number(s.food_charge_player2) || 0;
  const p1IsLoser = s.loser === "player1";
  const p1Total = (p1IsLoser ? tableCharge : 0) + food1;
  const p2Total = (!p1IsLoser ? tableCharge : 0) + food2;

  // Build bracket labels
  function bracket(isLoser: boolean, food: number) {
    const parts: string[] = [];
    if (isLoser) parts.push("Loser");
    if (food > 0) parts.push("Food");
    return parts.length ? `(${parts.join(" + ")})` : "(Won)";
  }

  const dur = s.end_time
    ? Math.floor((new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 1000 - (s.paused_seconds || 0))
    : 0;
  const durStr = dur > 0 ? `${Math.floor(dur / 60)}m` : "—";
  const timeStr = new Date(s.start_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  async function handleDelete() {
    if (!confirm(`Delete session #${s.id}? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/history/${s.id}/delete`, { method: "DELETE" });
    onRefresh();
    setDeleting(false);
  }

  return (
    <>
      <div className="rounded-xl border border-[var(--brass-500)]/15 bg-[var(--felt-800)]/30 p-3">
        {/* Top row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono-score text-xs text-[var(--brass-400)]">T{s.table_no} · #{s.id}</span>
            <span className="text-[var(--cream-300)]/50 text-xs">{timeStr}</span>
            <span className="text-[var(--cream-300)]/50 text-xs">· {durStr}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono-score text-xs text-[var(--brass-400)]">
              ₹{(tableCharge + food1 + food2).toFixed(0)} total
            </span>
            <button onClick={() => setShowEdit(true)} className="text-[10px] px-2 py-0.5 rounded border border-[var(--brass-500)]/30 text-[var(--cream-300)] hover:bg-white/5">✏</button>
            <button onClick={handleDelete} disabled={deleting} className="text-[10px] px-2 py-0.5 rounded border border-[var(--red-felt)]/40 text-[#e69aa6] hover:bg-[var(--red-felt)]/10 disabled:opacity-40">🗑</button>
          </div>
        </div>

        {/* Players with bracket labels */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${p1IsLoser ? "bg-[var(--red-felt)]" : "bg-emerald-500"}`} />
              <span className="text-[var(--cream-100)] text-sm font-medium truncate">{s.player1_name}</span>
            </div>
            <span className="text-[10px] text-[var(--brass-400)]/70 ml-3.5 mt-0.5">{bracket(p1IsLoser, food1)}</span>
            <span className="font-mono-score text-xs text-[var(--cream-300)] ml-3.5">₹{p1Total.toFixed(0)}</span>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--cream-100)] text-sm font-medium truncate">{s.player2_name}</span>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${!p1IsLoser ? "bg-[var(--red-felt)]" : "bg-emerald-500"}`} />
            </div>
            <span className="text-[10px] text-[var(--brass-400)]/70 mr-3.5 mt-0.5">{bracket(!p1IsLoser, food2)}</span>
            <span className="font-mono-score text-xs text-[var(--cream-300)] mr-3.5">₹{p2Total.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {showEdit && (
        <EditHistoryModal session={s} onClose={() => setShowEdit(false)} onSaved={onRefresh} />
      )}
    </>
  );
}

export default function HistoryPanel({ history, onRefresh }: { history: SessionRow[]; onRefresh: () => void }) {
  if (history.length === 0) {
    return <div className="text-center py-10 text-[var(--cream-300)]/40 text-sm">No confirmed sessions yet today</div>;
  }

  const totalRevenue = history.reduce((sum, s) => {
    return sum + Number(s.table_charge || 0) + Number(s.food_charge_player1 || 0) + Number(s.food_charge_player2 || 0);
  }, 0);

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-[var(--felt-800)]/50 border border-[var(--brass-500)]/20">
        <div className="text-center">
          <p className="font-mono-score text-lg font-bold text-[var(--brass-400)]">₹{totalRevenue.toFixed(0)}</p>
          <p className="text-xs text-[var(--cream-300)]">Sessions total</p>
        </div>
        <div className="text-center">
          <p className="font-mono-score text-lg font-bold text-[var(--brass-400)]">{history.length}</p>
          <p className="text-xs text-[var(--cream-300)]">Games</p>
        </div>
        <div className="text-center">
          <p className="font-mono-score text-lg font-bold text-[var(--brass-400)]">
            {history.filter(s => s.table_no === 1).length}/{history.filter(s => s.table_no === 2).length}
          </p>
          <p className="text-xs text-[var(--cream-300)]">T1 / T2</p>
        </div>
      </div>

      {/* Session rows */}
      {[...history].reverse().map(s => (
        <HistoryRow key={s.id} s={s} onRefresh={onRefresh} />
      ))}
    </div>
  );
}

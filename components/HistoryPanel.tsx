"use client";

import { useState } from "react";
import { SessionRow } from "@/lib/types";

interface FoodOrder {
  id: number; customer_name: string; items: string; amount: number; created_at: string;
}

function EditHistoryModal({ session, onClose, onSaved }: { session: SessionRow; onClose: () => void; onSaved: () => void }) {
  const [loser, setLoser] = useState<"player1" | "player2">(session.loser ?? "player1");
  const [food1, setFood1] = useState(String(Number(session.food_charge_player1) || 0));
  const [food2, setFood2] = useState(String(Number(session.food_charge_player2) || 0));
  const [tableCharge, setTableCharge] = useState(String(Number(session.table_charge) || 0));
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    await fetch(`/api/history/${session.id}/edit`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loser, food_charge_player1: Number(food1), food_charge_player2: Number(food2), table_charge: Number(tableCharge) }),
    });
    onSaved(); onClose(); setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="table-felt rounded-xl p-5 w-full max-w-sm shadow-2xl space-y-4">
        <h3 className="font-display text-lg font-bold">Edit History #{session.id}</h3>
        <div>
          <label className="block text-xs text-[var(--cream-300)] mb-1">Who lost?</label>
          <div className="grid grid-cols-2 gap-2">
            {(["player1","player2"] as const).map(p => (
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

function SessionRow_({ s, onRefresh }: { s: SessionRow; onRefresh: () => void }) {
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const tableCharge = Number(s.table_charge) || 0;
  const food1 = Number(s.food_charge_player1) || 0;
  const food2 = Number(s.food_charge_player2) || 0;
  const p1IsLoser = s.loser === "player1";
  const p1Total = (p1IsLoser ? tableCharge : 0) + food1;
  const p2Total = (!p1IsLoser ? tableCharge : 0) + food2;

  function bracket(isLoser: boolean, food: number) {
    const parts: string[] = [];
    if (isLoser) parts.push("Loser");
    if (food > 0) parts.push("Food");
    return parts.length ? `(${parts.join(" + ")})` : "(Won)";
  }

  const dur = s.end_time
    ? Math.floor((new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 1000 - (s.paused_seconds || 0))
    : 0;
  const timeStr = new Date(s.start_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  async function handleDelete() {
    if (!confirm(`Delete session #${s.id}? Cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/history/${s.id}/delete`, { method: "DELETE" });
    onRefresh(); setDeleting(false);
  }

  return (
    <>
      <div className="rounded-xl border border-[var(--brass-500)]/20 bg-[var(--felt-800)]/40 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono-score text-xs text-[var(--brass-400)]">T{s.table_no} · #{s.id}</span>
            <span className="text-[var(--cream-300)]/50 text-xs">{timeStr}</span>
            {dur > 0 && <span className="text-[var(--cream-300)]/50 text-xs">· {Math.floor(dur/60)}m</span>}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono-score text-xs text-[var(--brass-400)]">₹{(tableCharge+food1+food2).toFixed(0)}</span>
            <button onClick={() => setShowEdit(true)}
              className="text-xs px-2.5 py-1 rounded-md bg-[var(--brass-500)]/20 border border-[var(--brass-500)]/50 text-[var(--brass-400)] hover:bg-[var(--brass-500)]/40 hover:text-[var(--brass-400)] font-semibold transition-colors">
              Edit
            </button>
            <button onClick={handleDelete} disabled={deleting}
              className="text-xs px-2 py-1 rounded-md bg-[var(--red-felt)]/20 border border-[var(--red-felt)]/50 text-[#e69aa6] hover:bg-[var(--red-felt)]/40 transition-colors disabled:opacity-40">
              🗑
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${p1IsLoser ? "bg-[var(--red-felt)]" : "bg-emerald-500"}`} />
              <span className="text-[var(--cream-100)] text-sm font-medium truncate">{s.player1_name}</span>
            </div>
            <span className="text-[10px] text-[var(--brass-400)]/80 ml-3.5 italic">{bracket(p1IsLoser, food1)}</span>
            <span className="block font-mono-score text-xs text-[var(--cream-300)] ml-3.5">₹{p1Total.toFixed(0)}</span>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--cream-100)] text-sm font-medium truncate">{s.player2_name}</span>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${!p1IsLoser ? "bg-[var(--red-felt)]" : "bg-emerald-500"}`} />
            </div>
            <span className="text-[10px] text-[var(--brass-400)]/80 mr-3.5 italic">{bracket(!p1IsLoser, food2)}</span>
            <span className="block font-mono-score text-xs text-[var(--cream-300)] mr-3.5">₹{p2Total.toFixed(0)}</span>
          </div>
        </div>
      </div>
      {showEdit && <EditHistoryModal session={s} onClose={() => setShowEdit(false)} onSaved={onRefresh} />}
    </>
  );
}

function FoodRow({ o, onRefresh }: { o: FoodOrder; onRefresh: () => void }) {
  async function handleDelete() {
    if (!confirm("Delete this food order?")) return;
    await fetch(`/api/food-only/${o.id}`, { method: "DELETE" });
    onRefresh();
  }
  return (
    <div className="rounded-xl border border-[var(--brass-500)]/15 bg-[var(--felt-800)]/20 p-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--brass-500)]/20 text-[var(--brass-400)] font-mono-score">FOOD</span>
          <span className="text-sm font-medium text-[var(--cream-100)] truncate">{o.customer_name}</span>
          <span className="font-mono-score text-xs text-[var(--brass-400)]">₹{Number(o.amount).toFixed(0)}</span>
        </div>
        {o.items && <p className="text-xs text-[var(--cream-300)]/50 mt-0.5 ml-0 truncate">{o.items}</p>}
      </div>
      <button onClick={handleDelete} className="text-xs px-2 py-1 rounded-md bg-[var(--red-felt)]/20 border border-[var(--red-felt)]/40 text-[#e69aa6] hover:bg-[var(--red-felt)]/30 flex-shrink-0">🗑</button>
    </div>
  );
}

export default function HistoryPanel({ history, foodHistory, onRefresh }: {
  history: SessionRow[]; foodHistory: FoodOrder[]; onRefresh: () => void;
}) {
  // Pool money = table charges from games (money earned from the tables)
  const poolMoney = history.reduce((sum, s) => sum + Number(s.table_charge || 0), 0);
  // Food money bought by players during their game
  const playerFood = history.reduce((sum, s) =>
    sum + Number(s.food_charge_player1 || 0) + Number(s.food_charge_player2 || 0), 0);
  // Food money from walk-in food-only customers
  const foodOnlyMoney = foodHistory.reduce((sum, f) => sum + Number(f.amount || 0), 0);
  const foodMoney = playerFood + foodOnlyMoney;
  const total = poolMoney + foodMoney;

  if (history.length === 0 && foodHistory.length === 0) {
    return <div className="text-center py-10 text-[var(--cream-300)]/40 text-sm">No confirmed sessions yet today</div>;
  }

  return (
    <div className="space-y-3">
      {/* Summary — Pool vs Food */}
      <div className="p-3 rounded-xl bg-[var(--felt-800)]/50 border border-[var(--brass-500)]/20 space-y-3">
        <div className="text-center">
          <p className="font-mono-score text-2xl font-bold text-[var(--brass-400)]">₹{total.toFixed(0)}</p>
          <p className="text-[10px] text-[var(--cream-300)]/60 uppercase tracking-widest">Day Total</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center rounded-lg bg-[var(--felt-800)]/60 border border-[var(--brass-500)]/15 py-2">
            <p className="font-mono-score text-lg font-bold text-[var(--cream-100)]">₹{poolMoney.toFixed(0)}</p>
            <p className="text-[10px] text-[var(--cream-300)]/60 uppercase tracking-wider">Pool Money</p>
          </div>
          <div className="text-center rounded-lg bg-[var(--felt-800)]/60 border border-[var(--brass-500)]/15 py-2">
            <p className="font-mono-score text-lg font-bold text-[var(--cream-100)]">₹{foodMoney.toFixed(0)}</p>
            <p className="text-[10px] text-[var(--cream-300)]/60 uppercase tracking-wider">Food Money</p>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] text-[var(--cream-300)]/50">
          <span>{history.length} games</span>
          <span>Player food ₹{playerFood.toFixed(0)}</span>
          <span>{foodHistory.length} food-only ₹{foodOnlyMoney.toFixed(0)}</span>
        </div>
      </div>

      {/* Sessions */}
      {history.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-[var(--brass-400)] font-semibold uppercase tracking-wider">Game Sessions</p>
          {[...history].reverse().map(s => <SessionRow_ key={s.id} s={s} onRefresh={onRefresh} />)}
        </div>
      )}

      {/* Food orders in history */}
      {foodHistory.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-[var(--brass-400)] font-semibold uppercase tracking-wider">Food Orders</p>
          {foodHistory.map(o => <FoodRow key={o.id} o={o} onRefresh={onRefresh} />)}
        </div>
      )}

      {/* Club watermark footer */}
      <p className="text-center text-[10px] text-[var(--cream-300)]/20 pt-2 tracking-widest uppercase">
        Black Racks Snooker Club
      </p>
    </div>
  );
}

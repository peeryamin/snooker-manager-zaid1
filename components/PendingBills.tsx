"use client";

import { useState } from "react";
import { SessionRow } from "@/lib/types";

function EditBillModal({ session, onClose, onSaved }: { session: SessionRow; onClose: () => void; onSaved: () => void }) {
  const [loser, setLoser] = useState<"player1" | "player2">(session.loser ?? "player1");
  const [food1, setFood1] = useState(String(Number(session.food_charge_player1) || 0));
  const [food2, setFood2] = useState(String(Number(session.food_charge_player2) || 0));
  const [tableCharge, setTableCharge] = useState(String(Number(session.table_charge) || 0));
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    await fetch(`/api/bills/${session.id}/edit`, {
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
        <h3 className="font-display text-lg font-bold">Edit Bill #{session.id}</h3>
        <div>
          <label className="block text-xs text-[var(--cream-300)] mb-1">Who lost?</label>
          <div className="grid grid-cols-2 gap-2">
            {(["player1","player2"] as const).map((p) => (
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
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PlayerBillCard({ session, isPlayer1, onRefresh }: { session: SessionRow; isPlayer1: boolean; onRefresh: () => void }) {
  const tableCharge = Number(session.table_charge) || 0;
  const food = isPlayer1 ? Number(session.food_charge_player1) || 0 : Number(session.food_charge_player2) || 0;
  const isLoser = session.loser === (isPlayer1 ? "player1" : "player2");
  const name = isPlayer1 ? session.player1_name : session.player2_name;
  const total = (isLoser ? tableCharge : 0) + food;

  const whatPaying: string[] = [];
  if (isLoser) whatPaying.push("Table");
  if (food > 0) whatPaying.push("Food");

  const [showEdit, setShowEdit] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleConfirm() {
    setConfirming(true);
    await fetch(`/api/bills/${session.id}/confirm`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    onRefresh();
    setConfirming(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this bill? This cannot be undone.")) return;
    setDeleting(true);
    await fetch(`/api/bills/${session.id}/delete`, { method: "DELETE" });
    onRefresh();
    setDeleting(false);
  }

  return (
    <>
      <div className="table-felt rounded-xl p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono-score text-[10px] text-[var(--brass-400)] tracking-widest">
              TABLE {session.table_no} · BILL #{session.id}
            </p>
            <p className="font-semibold text-[var(--cream-100)] text-base mt-0.5">{name}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {isLoser ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--red-felt)]/40 text-[#e69aa6] border border-[var(--red-felt)]/40">Lost</span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/30 text-emerald-300 border border-emerald-800/40">Won</span>
            )}
            <span className="text-[10px] text-[var(--cream-300)]/50">vs {isPlayer1 ? session.player2_name : session.player1_name}</span>
          </div>
        </div>

        <div className="brass-line" />

        {/* Breakdown */}
        <div className="space-y-1.5 text-sm">
          {isLoser && (
            <div className="flex justify-between">
              <span className="text-[var(--cream-300)]">Table charge</span>
              <span className="font-mono-score">₹{tableCharge.toFixed(0)}</span>
            </div>
          )}
          {food > 0 && (
            <div className="flex justify-between">
              <span className="text-[var(--cream-300)]">Food</span>
              <span className="font-mono-score">₹{food.toFixed(0)}</span>
            </div>
          )}
          {whatPaying.length === 0 && (
            <p className="text-xs text-[var(--cream-300)]/50">No charges</p>
          )}
        </div>

        {/* What paying for bracket */}
        {whatPaying.length > 0 && (
          <p className="text-[10px] text-[var(--brass-400)]/80 italic">({whatPaying.join(" + ")})</p>
        )}

        <div className="brass-line" />

        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-[var(--cream-100)]">Total</span>
          <span className="font-mono-score text-lg font-bold text-[var(--brass-400)]">₹{total.toFixed(0)}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button onClick={() => setShowEdit(true)} className="flex-1 rounded-md py-1.5 text-xs border border-[var(--brass-500)]/40 text-[var(--cream-300)] hover:bg-white/5">
            ✏ Edit
          </button>
          <button onClick={handleConfirm} disabled={confirming} className="flex-1 rounded-md py-1.5 text-xs bg-[var(--brass-500)] text-[var(--ink)] font-semibold hover:bg-[var(--brass-400)] disabled:opacity-60">
            {confirming ? "…" : "✓ Confirm"}
          </button>
          <button onClick={handleDelete} disabled={deleting} className="px-3 rounded-md py-1.5 text-xs border border-[var(--red-felt)]/50 text-[#e69aa6] hover:bg-[var(--red-felt)]/20 disabled:opacity-60">
            🗑
          </button>
        </div>
      </div>

      {showEdit && (
        <EditBillModal session={session} onClose={() => setShowEdit(false)} onSaved={onRefresh} />
      )}
    </>
  );
}

function AddManualBillModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [tableNo, setTableNo] = useState<1 | 2>(1);
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [loser, setLoser] = useState<"player1" | "player2">("player1");
  const [food1, setFood1] = useState("0");
  const [food2, setFood2] = useState("0");
  const [duration, setDuration] = useState("60");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd() {
    setError("");
    if (!p1.trim() || !p2.trim()) { setError("Both player names required"); return; }
    setLoading(true);
    const res = await fetch("/api/bills/add-manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table_no: tableNo, player1_name: p1, player2_name: p2, loser, food_charge_player1: Number(food1), food_charge_player2: Number(food2), duration_minutes: Number(duration) }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed"); setLoading(false); return; }
    onAdded();
    onClose();
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="table-felt rounded-xl p-5 w-full max-w-sm shadow-2xl space-y-3 max-h-[90vh] overflow-y-auto">
        <h3 className="font-display text-lg font-bold">Add Forgotten Bill</h3>
        <div className="grid grid-cols-2 gap-2">
          {([1, 2] as const).map(t => (
            <button key={t} type="button" onClick={() => setTableNo(t)}
              className={`rounded-md py-2 text-sm border ${tableNo === t ? "bg-[var(--brass-500)] text-[var(--ink)] font-semibold" : "border-[var(--brass-500)]/40 hover:bg-white/5"}`}>
              Table {t}
            </button>
          ))}
        </div>
        <div>
          <label className="block text-xs text-[var(--cream-300)] mb-1">Player 1</label>
          <input className="w-full" value={p1} onChange={e => setP1(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-[var(--cream-300)] mb-1">Player 2</label>
          <input className="w-full" value={p2} onChange={e => setP2(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-[var(--cream-300)] mb-1">Duration (minutes)</label>
          <input type="number" min="1" className="w-full" value={duration} onChange={e => setDuration(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-[var(--cream-300)] mb-1">Who lost?</label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setLoser("player1")} className={`rounded-md py-1.5 text-sm border ${loser === "player1" ? "bg-[var(--brass-500)] text-[var(--ink)] font-semibold" : "border-[var(--brass-500)]/40"}`}>{p1 || "Player 1"}</button>
            <button type="button" onClick={() => setLoser("player2")} className={`rounded-md py-1.5 text-sm border ${loser === "player2" ? "bg-[var(--brass-500)] text-[var(--ink)] font-semibold" : "border-[var(--brass-500)]/40"}`}>{p2 || "Player 2"}</button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[var(--cream-300)] mb-1">{p1 || "P1"} food (₹)</label>
            <input type="number" min="0" className="w-full" value={food1} onChange={e => setFood1(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-[var(--cream-300)] mb-1">{p2 || "P2"} food (₹)</label>
            <input type="number" min="0" className="w-full" value={food2} onChange={e => setFood2(e.target.value)} />
          </div>
        </div>
        {error && <p className="text-sm text-[#e69aa6]">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-md border border-[var(--brass-500)]/40 text-[var(--cream-300)] hover:bg-white/5">Cancel</button>
          <button onClick={handleAdd} disabled={loading} className="px-4 py-2 rounded-md bg-[var(--brass-500)] text-[var(--ink)] font-semibold disabled:opacity-60">
            {loading ? "Adding…" : "Add to History"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PendingBills({ bills, onRefresh }: { bills: SessionRow[]; onRefresh: () => void }) {
  const [showAddManual, setShowAddManual] = useState(false);

  // Expand each session into two individual player cards
  const individualCards: { session: SessionRow; isPlayer1: boolean }[] = [];
  for (const b of bills) {
    individualCards.push({ session: b, isPlayer1: true });
    individualCards.push({ session: b, isPlayer1: false });
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-[var(--cream-300)]">
          {bills.length === 0 ? "No pending bills" : `${bills.length} session${bills.length > 1 ? "s" : ""} · ${individualCards.length} bills`}
        </p>
        <button
          onClick={() => setShowAddManual(true)}
          className="text-xs px-3 py-1.5 rounded-md border border-[var(--brass-500)]/40 text-[var(--brass-400)] hover:bg-white/5"
        >
          + Add Forgotten Bill
        </button>
      </div>

      {individualCards.length === 0 ? (
        <div className="text-center py-10 text-[var(--cream-300)]/40 text-sm">
          No bills awaiting confirmation
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {individualCards.map(({ session, isPlayer1 }) => (
            <PlayerBillCard
              key={`${session.id}-${isPlayer1 ? "p1" : "p2"}`}
              session={session}
              isPlayer1={isPlayer1}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}

      {showAddManual && (
        <AddManualBillModal
          onClose={() => setShowAddManual(false)}
          onAdded={() => { onRefresh(); setShowAddManual(false); }}
        />
      )}
    </>
  );
}

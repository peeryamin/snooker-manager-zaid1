"use client";

import { useState } from "react";
import { SessionRow } from "@/lib/types";

function BillModal({
  session,
  onClose,
  onConfirmed,
}: {
  session: SessionRow;
  onClose: () => void;
  onConfirmed: () => void;
}) {
  const tableCharge = Number(session.table_charge) || 0;
  const food1 = Number(session.food_charge_player1) || 0;
  const food2 = Number(session.food_charge_player2) || 0;
  const [editFood1, setEditFood1] = useState(String(food1));
  const [editFood2, setEditFood2] = useState(String(food2));
  const [loading, setLoading] = useState(false);

  const f1 = Number(editFood1) || 0;
  const f2 = Number(editFood2) || 0;
  const p1IsLoser = session.loser === "player1";
  const p1Total = (p1IsLoser ? tableCharge : 0) + f1;
  const p2Total = (!p1IsLoser ? tableCharge : 0) + f2;

  async function handleConfirm() {
    setLoading(true);
    const res = await fetch(`/api/bills/${session.id}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ food_charge_player1: f1, food_charge_player2: f2 }),
    });
    if (res.ok) {
      onConfirmed();
      onClose();
    }
    setLoading(false);
  }

  const startTime = new Date(session.start_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const endTime = session.end_time
    ? new Date(session.end_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : "—";
  const dur = session.end_time
    ? Math.floor((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 1000 - (session.paused_seconds || 0))
    : 0;
  const durStr = `${Math.floor(dur / 60)}m ${dur % 60}s active`;

  function PlayerBill({
    name,
    isLoser,
    food,
    total,
  }: {
    name: string;
    isLoser: boolean;
    food: number;
    total: number;
  }) {
    return (
      <div className="flex-1 rounded-xl border border-[var(--brass-500)]/25 bg-[var(--felt-900)]/50 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-[var(--cream-100)]">{name}</p>
          {isLoser ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--red-felt)]/40 text-[#e69aa6] border border-[var(--red-felt)]/40">
              Lost
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-900/30 text-emerald-300 border border-emerald-800/40">
              Won
            </span>
          )}
        </div>
        <div className="brass-line" />
        {isLoser && (
          <div className="flex justify-between text-sm">
            <span className="text-[var(--cream-300)]">Table charge</span>
            <span className="font-mono-score">₹{tableCharge.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-[var(--cream-300)]">Food</span>
          <span className="font-mono-score">₹{food.toFixed(2)}</span>
        </div>
        <div className="brass-line" />
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span className="font-mono-score text-[var(--brass-400)]">₹{total.toFixed(2)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="table-felt rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div>
          <p className="font-mono-score text-xs tracking-widest text-[var(--brass-400)]">BILL PREVIEW</p>
          <h2 className="font-display text-2xl font-bold mt-0.5">Table {session.table_no}</h2>
          <p className="text-xs text-[var(--cream-300)] mt-1">
            {startTime} → {endTime} · {durStr}
          </p>
        </div>

        <div className="brass-line" />

        {/* Edit food charges */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[var(--cream-300)] mb-1">
              {session.player1_name}&apos;s food (₹)
            </label>
            <input
              type="number"
              min="0"
              className="w-full"
              value={editFood1}
              onChange={(e) => setEditFood1(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--cream-300)] mb-1">
              {session.player2_name}&apos;s food (₹)
            </label>
            <input
              type="number"
              min="0"
              className="w-full"
              value={editFood2}
              onChange={(e) => setEditFood2(e.target.value)}
            />
          </div>
        </div>

        {/* Two bills side-by-side */}
        <div className="flex gap-3">
          <PlayerBill name={session.player1_name} isLoser={p1IsLoser} food={f1} total={p1Total} />
          <PlayerBill name={session.player2_name} isLoser={!p1IsLoser} food={f2} total={p2Total} />
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-[var(--brass-500)]/40 text-[var(--cream-300)] hover:bg-white/5"
          >
            Close
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-[var(--brass-500)] text-[var(--ink)] font-semibold hover:bg-[var(--brass-400)] disabled:opacity-60"
          >
            {loading ? "Confirming…" : "Confirm & Move to History"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PendingBills({
  bills,
  onRefresh,
}: {
  bills: SessionRow[];
  onRefresh: () => void;
}) {
  const [selected, setSelected] = useState<SessionRow | null>(null);

  if (bills.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--cream-300)]/40 text-sm">
        No bills awaiting confirmation
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {bills.map((b) => {
          const tableCharge = Number(b.table_charge) || 0;
          const food1 = Number(b.food_charge_player1) || 0;
          const food2 = Number(b.food_charge_player2) || 0;
          const p1Total = (b.loser === "player1" ? tableCharge : 0) + food1;
          const p2Total = (b.loser === "player2" ? tableCharge : 0) + food2;

          return (
            <button
              key={b.id}
              onClick={() => setSelected(b)}
              className="table-felt rounded-xl p-4 text-left hover:border-[var(--brass-500)]/50 transition-all group"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-mono-score text-xs text-[var(--brass-400)]">TABLE {b.table_no} · #{b.id}</p>
                  <p className="text-sm font-semibold mt-0.5 text-[var(--cream-100)]">
                    {b.player1_name} vs {b.player2_name}
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900/40 border border-amber-700/40 text-amber-300">
                  Pending
                </span>
              </div>
              <div className="flex gap-3 text-xs text-[var(--cream-300)] mt-2">
                <span>{b.player1_name}: ₹{p1Total.toFixed(0)}</span>
                <span>·</span>
                <span>{b.player2_name}: ₹{p2Total.toFixed(0)}</span>
              </div>
              <p className="text-xs text-[var(--brass-400)]/70 mt-2 group-hover:text-[var(--brass-400)] transition-colors">
                Tap to review &amp; confirm →
              </p>
            </button>
          );
        })}
      </div>

      {selected && (
        <BillModal
          session={selected}
          onClose={() => setSelected(null)}
          onConfirmed={() => {
            setSelected(null);
            onRefresh();
          }}
        />
      )}
    </>
  );
}

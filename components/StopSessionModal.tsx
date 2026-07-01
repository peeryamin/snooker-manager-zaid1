"use client";

import { useState } from "react";
import { SessionRow } from "@/lib/types";

export default function StopSessionModal({ session, onClose, onStopped }: {
  session: SessionRow; onClose: () => void; onStopped: () => void;
}) {
  const [loser, setLoser] = useState<"player1" | "player2" | "">("");
  const [food1, setFood1] = useState("");
  const [food2, setFood2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleStop(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!loser) { setError("Please select who lost the game."); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${session.id}/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loser,
          food_charge_player1: Number(food1) || 0,
          food_charge_player2: Number(food2) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Could not stop session"); return; }
      onStopped(); onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <form onSubmit={handleStop}
        className="table-felt rounded-2xl p-7 w-full max-w-md shadow-2xl space-y-5">

        {/* Header */}
        <div>
          <p className="font-mono-score text-[10px] tracking-widest text-[var(--brass-400)]">BLACK RACKS SNOOKER CLUB</p>
          <h2 className="font-display text-2xl font-bold mt-0.5">End Session — Table {session.table_no}</h2>
          <p className="text-sm text-[var(--cream-300)] mt-1">{session.player1_name} vs {session.player2_name}</p>
        </div>

        <div className="brass-line" />

        {/* Loser selection */}
        <div>
          <label className="block text-sm font-semibold text-[var(--cream-100)] mb-2">
            Who lost? <span className="text-[var(--cream-300)] font-normal text-xs">(they pay the table charge)</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(["player1","player2"] as const).map(p => (
              <button key={p} type="button" onClick={() => setLoser(p)}
                className={`rounded-xl py-4 text-sm border-2 transition-all ${
                  loser === p
                    ? "bg-[var(--brass-500)] text-[var(--ink)] border-[var(--brass-500)] font-bold text-base shadow-lg scale-[1.02]"
                    : "border-[var(--brass-500)]/30 text-[var(--cream-100)] hover:border-[var(--brass-500)]/60 hover:bg-white/5"
                }`}>
                {p === "player1" ? session.player1_name : session.player2_name}
              </button>
            ))}
          </div>
        </div>

        {/* Food charges */}
        <div>
          <label className="block text-sm font-semibold text-[var(--cream-100)] mb-2">
            Food charges <span className="text-[var(--cream-300)] font-normal text-xs">(leave blank if none)</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--brass-400)] mb-1">{session.player1_name}</label>
              <input type="number" min="0" step="any" className="w-full text-sm"
                placeholder="₹0" value={food1} onChange={e => setFood1(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-[var(--brass-400)] mb-1">{session.player2_name}</label>
              <input type="number" min="0" step="any" className="w-full text-sm"
                placeholder="₹0" value={food2} onChange={e => setFood2(e.target.value)} />
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-[#e69aa6] bg-[var(--red-felt)]/20 border border-[var(--red-felt)]/40 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose}
            className="flex-1 rounded-xl py-3 border border-[var(--brass-500)]/30 text-[var(--cream-300)] hover:bg-white/5 font-medium">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 rounded-xl py-3 bg-[var(--red-felt)] text-[var(--cream-100)] font-bold hover:opacity-90 disabled:opacity-60 shadow-lg">
            {loading ? "Ending…" : "End & Generate Bill"}
          </button>
        </div>
      </form>
    </div>
  );
}

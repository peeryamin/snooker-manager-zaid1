"use client";

import { useState } from "react";
import { SessionRow } from "@/lib/types";

export default function StopSessionModal({
  session,
  onClose,
  onStopped,
}: {
  session: SessionRow;
  onClose: () => void;
  onStopped: () => void;
}) {
  const [loser, setLoser] = useState<"player1" | "player2" | "">("");
  const [food1, setFood1] = useState("0");
  const [food2, setFood2] = useState("0");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleStop(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!loser) {
      setError("Please select who lost the game.");
      return;
    }
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
      if (!res.ok) {
        setError(data.error || "Could not stop session");
        return;
      }
      onStopped();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <form
        onSubmit={handleStop}
        className="table-felt rounded-xl p-6 w-full max-w-sm shadow-2xl space-y-4"
      >
        <h2 className="font-display text-xl font-bold">
          End Session — Table {session.table_no}
        </h2>
        <p className="text-sm text-[var(--cream-300)]">
          {session.player1_name} vs {session.player2_name}
        </p>

        <div>
          <label className="block text-xs text-[var(--cream-300)] mb-1">
            Who lost? (table charge goes to them)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setLoser("player1")}
              className={`rounded-md py-2 text-sm border ${
                loser === "player1"
                  ? "bg-[var(--brass-500)] text-[var(--ink)] border-[var(--brass-500)] font-semibold"
                  : "border-[var(--brass-500)]/40 hover:bg-white/5"
              }`}
            >
              {session.player1_name}
            </button>
            <button
              type="button"
              onClick={() => setLoser("player2")}
              className={`rounded-md py-2 text-sm border ${
                loser === "player2"
                  ? "bg-[var(--brass-500)] text-[var(--ink)] border-[var(--brass-500)] font-semibold"
                  : "border-[var(--brass-500)]/40 hover:bg-white/5"
              }`}
            >
              {session.player2_name}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[var(--cream-300)] mb-1">
              {session.player1_name}&apos;s food (₹)
            </label>
            <input
              type="number"
              min="0"
              step="any"
              className="w-full"
              value={food1}
              onChange={(e) => setFood1(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--cream-300)] mb-1">
              {session.player2_name}&apos;s food (₹)
            </label>
            <input
              type="number"
              min="0"
              step="any"
              className="w-full"
              value={food2}
              onChange={(e) => setFood2(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-[#e69aa6]">{error}</p>}

        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-[var(--brass-500)]/40 text-[var(--cream-300)] hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-md bg-[var(--red-felt)] text-[var(--cream-100)] font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Ending…" : "End & Generate Bill"}
          </button>
        </div>
      </form>
    </div>
  );
}

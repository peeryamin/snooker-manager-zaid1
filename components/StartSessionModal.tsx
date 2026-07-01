"use client";

import { useState } from "react";

export default function StartSessionModal({
  tableNo,
  onClose,
  onStarted,
}: {
  tableNo: 1 | 2;
  onClose: () => void;
  onStarted: () => void;
}) {
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/sessions/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table_no: tableNo, player1_name: p1, player2_name: p2 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not start session");
        return;
      }
      onStarted();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <form
        onSubmit={handleStart}
        className="table-felt rounded-xl p-6 w-full max-w-sm shadow-2xl space-y-4"
      >
        <h2 className="font-display text-xl font-bold">
          Start Session — Table {tableNo}
        </h2>
        <div>
          <label className="block text-xs text-[var(--cream-300)] mb-1">Player 1 name</label>
          <input className="w-full" value={p1} onChange={(e) => setP1(e.target.value)} autoFocus required />
        </div>
        <div>
          <label className="block text-xs text-[var(--cream-300)] mb-1">Player 2 name</label>
          <input className="w-full" value={p2} onChange={(e) => setP2(e.target.value)} required />
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
            className="px-4 py-2 rounded-md bg-[var(--brass-500)] text-[var(--ink)] font-semibold hover:bg-[var(--brass-400)] disabled:opacity-60"
          >
            {loading ? "Starting…" : "Start Session"}
          </button>
        </div>
      </form>
    </div>
  );
}

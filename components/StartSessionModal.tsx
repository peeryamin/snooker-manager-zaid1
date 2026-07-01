"use client";

import { useState, useRef, useEffect } from "react";

export default function StartSessionModal({ tableNo, onClose, onStarted }: {
  tableNo: 1 | 2; onClose: () => void; onStarted: () => void;
}) {
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const p1Ref = useRef<HTMLInputElement>(null);

  useEffect(() => { p1Ref.current?.focus(); }, []);

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!p1.trim() || !p2.trim()) { setError("Both player names required"); return; }
    setError("");
    setLoading(true);
    const res = await fetch("/api/sessions/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table_no: tableNo, player1_name: p1.trim(), player2_name: p2.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Could not start session"); setLoading(false); return; }
    // Close instantly, refresh in background
    onStarted();
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <form onSubmit={handleStart}
        className="table-felt rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
        <div>
          <p className="font-mono-score text-[10px] tracking-widest text-[var(--brass-400)]">BLACK RACKS SNOOKER CLUB</p>
          <h2 className="font-display text-xl font-bold mt-0.5">Start Session · Table {tableNo}</h2>
        </div>
        <div>
          <label className="block text-xs text-[var(--cream-300)] mb-1">Player 1</label>
          <input ref={p1Ref} className="w-full" value={p1} onChange={e => setP1(e.target.value)}
            onKeyDown={e => e.key === "Tab" && !p2 && e.preventDefault()} required />
        </div>
        <div>
          <label className="block text-xs text-[var(--cream-300)] mb-1">Player 2</label>
          <input className="w-full" value={p2} onChange={e => setP2(e.target.value)} required />
        </div>
        {error && <p className="text-sm text-[#e69aa6]">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose}
            className="flex-1 rounded-md py-2.5 border border-[var(--brass-500)]/30 text-[var(--cream-300)] hover:bg-white/5 active:scale-95 transition-all">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 rounded-md py-2.5 bg-[var(--brass-500)] text-[var(--ink)] font-semibold hover:bg-[var(--brass-400)] active:scale-95 transition-all disabled:opacity-60">
            {loading ? "Starting…" : "▶ Start"}
          </button>
        </div>
      </form>
    </div>
  );
}

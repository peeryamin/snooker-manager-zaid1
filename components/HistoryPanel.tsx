"use client";

import { SessionRow } from "@/lib/types";

export default function HistoryPanel({ history }: { history: SessionRow[] }) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--cream-300)]/40 text-sm">
        No confirmed sessions yet today
      </div>
    );
  }

  const totalRevenue = history.reduce((sum, s) => {
    return sum + Number(s.table_charge || 0) + Number(s.food_charge_player1 || 0) + Number(s.food_charge_player2 || 0);
  }, 0);

  return (
    <div className="space-y-3">
      {/* Daily summary */}
      <div className="flex gap-4 p-3 rounded-lg bg-[var(--felt-800)]/50 border border-[var(--brass-500)]/20">
        <div className="text-center flex-1">
          <p className="font-mono-score text-lg font-bold text-[var(--brass-400)]">
            ₹{totalRevenue.toFixed(0)}
          </p>
          <p className="text-xs text-[var(--cream-300)]">Total today</p>
        </div>
        <div className="text-center flex-1">
          <p className="font-mono-score text-lg font-bold text-[var(--brass-400)]">
            {history.length}
          </p>
          <p className="text-xs text-[var(--cream-300)]">Sessions</p>
        </div>
        <div className="text-center flex-1">
          <p className="font-mono-score text-lg font-bold text-[var(--brass-400)]">
            {history.filter((s) => s.table_no === 1).length} / {history.filter((s) => s.table_no === 2).length}
          </p>
          <p className="text-xs text-[var(--cream-300)]">T1 / T2</p>
        </div>
      </div>

      {/* Session rows */}
      {[...history].reverse().map((s) => {
        const tableCharge = Number(s.table_charge) || 0;
        const food1 = Number(s.food_charge_player1) || 0;
        const food2 = Number(s.food_charge_player2) || 0;
        const p1Total = (s.loser === "player1" ? tableCharge : 0) + food1;
        const p2Total = (s.loser === "player2" ? tableCharge : 0) + food2;
        const dur = s.end_time
          ? Math.floor(
              (new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 1000 -
                (s.paused_seconds || 0)
            )
          : 0;
        const durStr = dur > 0 ? `${Math.floor(dur / 60)}m` : "—";
        const timeStr = new Date(s.start_time).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <div
            key={s.id}
            className="rounded-xl border border-[var(--brass-500)]/15 bg-[var(--felt-800)]/30 p-3 text-sm"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-mono-score text-xs text-[var(--brass-400)]">
                  T{s.table_no} · #{s.id}
                </span>
                <span className="text-[var(--cream-300)]/50 text-xs">{timeStr}</span>
                <span className="text-[var(--cream-300)]/50 text-xs">· {durStr}</span>
              </div>
              <span className="font-mono-score text-xs text-[var(--brass-400)]">
                ₹{(tableCharge + food1 + food2).toFixed(0)} total
              </span>
            </div>
            <div className="flex gap-4 mt-1">
              <div className="flex items-center gap-1">
                {s.loser === "player1" ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--red-felt)] inline-block" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                )}
                <span className="text-[var(--cream-100)]">{s.player1_name}</span>
                <span className="text-[var(--cream-300)]/60 font-mono-score ml-1">₹{p1Total.toFixed(0)}</span>
              </div>
              <span className="text-[var(--cream-300)]/30 text-xs self-center">vs</span>
              <div className="flex items-center gap-1">
                {s.loser === "player2" ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--red-felt)] inline-block" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                )}
                <span className="text-[var(--cream-100)]">{s.player2_name}</span>
                <span className="text-[var(--cream-300)]/60 font-mono-score ml-1">₹{p2Total.toFixed(0)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

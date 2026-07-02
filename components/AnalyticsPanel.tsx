"use client";

import { useEffect, useState, useCallback } from "react";

type Range = "today" | "week" | "month";

interface Analytics {
  totalRevenue: number; tableRevenue: number; foodRevenue: number;
  sessionCount: number; foodOrderCount: number; avgDurationMin: number;
  peakHour: number | null;
  table1: { revenue: number; sessions: number };
  table2: { revenue: number; sessions: number };
  hourlyDistribution: { hour: number; count: number }[];
  dailyRevenue: { date: string; pool: number; food: number }[];
  topPlayers: { name: string; games: number; wins: number; losses: number; spent: number }[];
}

const hourLabel = (h: number) => {
  const s = h >= 12 ? "PM" : "AM";
  const x = h % 12 === 0 ? 12 : h % 12;
  return `${x}${s}`;
};

const TREND_MAX_PX = 110;
const HOUR_MAX_PX = 90;

export default function AnalyticsPanel() {
  const [range, setRange] = useState<Range>("today");
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (r: Range) => {
    setLoading(true);
    const res = await fetch(`/api/stats/analytics?range=${r}`);
    setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(range); }, [range, load]);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <span className="text-3xl animate-spin">🎱</span>
        <p className="text-[var(--brass-400)] font-mono-score text-sm">Loading analytics…</p>
      </div>
    );
  }

  const maxDaily = Math.max(1, ...data.dailyRevenue.map((d) => d.pool + d.food));
  const hrs = data.hourlyDistribution.filter((h) => h.hour >= 8 && h.hour <= 23);
  const maxHour = Math.max(1, ...hrs.map((h) => h.count));
  const tblTotal = Math.max(1, data.table1.revenue + data.table2.revenue);
  const t1pct = Math.round((data.table1.revenue / tblTotal) * 100);
  const rupee = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {(["today", "week", "month"] as const).map((r) => (
          <button key={r} onClick={() => setRange(r)}
            className={`flex-1 rounded-md py-1.5 text-sm border transition-colors ${
              range === r
                ? "bg-[var(--brass-500)] text-[var(--ink)] border-[var(--brass-500)] font-semibold"
                : "border-[var(--brass-500)]/30 text-[var(--cream-300)] hover:bg-white/5"
            }`}>
            {r === "today" ? "Today" : r === "week" ? "7 Days" : "30 Days"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Revenue", value: rupee(data.totalRevenue) },
          { label: "Sessions", value: String(data.sessionCount) },
          { label: "Avg Duration", value: `${data.avgDurationMin}m` },
          { label: "Peak Hour", value: data.peakHour != null ? hourLabel(data.peakHour) : "—" },
        ].map((c) => (
          <div key={c.label} className="table-felt rounded-xl p-3 border border-[var(--brass-500)]/20">
            <p className="font-mono-score text-[9px] tracking-widest text-[var(--brass-400)] uppercase">{c.label}</p>
            <p className="font-mono-score text-xl font-bold text-[var(--cream-100)] mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="table-felt rounded-xl p-4 border border-[var(--brass-500)]/20">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-[var(--cream-300)] uppercase tracking-wider">Revenue Trend</p>
          <div className="flex items-center gap-3 text-[10px] text-[var(--cream-300)]/70">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[var(--brass-500)]/80 inline-block" /> Pool</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/70 inline-block" /> Food</span>
          </div>
        </div>
        {data.dailyRevenue.length === 0 ? (
          <p className="text-xs text-[var(--cream-300)]/40 py-6 text-center">No confirmed bills yet</p>
        ) : (
          <div className="flex items-end gap-1.5">
            {data.dailyRevenue.map((d) => {
              const poolPx = (d.pool / maxDaily) * TREND_MAX_PX;
              const foodPx = (d.food / maxDaily) * TREND_MAX_PX;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center justify-end gap-1">
                  <span className="text-[9px] text-[var(--brass-400)]/70 font-mono-score">{rupee(d.pool + d.food)}</span>
                  <div className="w-full flex flex-col justify-end"
                    title={`${d.date} — Pool ${rupee(d.pool)} · Food ${rupee(d.food)}`}
                    style={{ height: `${Math.max(6, poolPx + foodPx)}px` }}>
                    {d.food > 0 && <div className="w-full rounded-t bg-emerald-500/70" style={{ height: `${Math.max(2, foodPx)}px` }} />}
                    {d.pool > 0 && <div className={`w-full bg-[var(--brass-500)]/80 ${d.food > 0 ? "" : "rounded-t"}`} style={{ height: `${Math.max(2, poolPx)}px` }} />}
                  </div>
                  <span className="text-[8px] text-[var(--cream-300)]/40">{d.date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="table-felt rounded-xl p-4 border border-[var(--brass-500)]/20">
        <p className="text-xs font-semibold text-[var(--cream-300)] mb-3 uppercase tracking-wider">Hourly Activity</p>
        <div className="flex items-end gap-1">
          {hrs.map((h) => (
            <div key={h.hour} className="flex-1 flex flex-col items-center justify-end gap-1">
              <div className="w-full rounded-t bg-[var(--cream-300)]/50"
                style={{ height: `${Math.max(3, (h.count / maxHour) * HOUR_MAX_PX)}px` }}
                title={`${hourLabel(h.hour)}: ${h.count} sessions`} />
              <span className="text-[7px] text-[var(--cream-300)]/40 whitespace-nowrap">{hourLabel(h.hour)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="table-felt rounded-xl p-4 border border-[var(--brass-500)]/20">
        <p className="text-xs font-semibold text-[var(--cream-300)] mb-3 uppercase tracking-wider">Table 1 vs Table 2</p>
        <div className="w-full h-3 rounded-full overflow-hidden flex mb-2">
          <div className="bg-[var(--brass-500)]" style={{ width: `${t1pct}%` }} />
          <div className="bg-[var(--cream-300)]/50" style={{ width: `${100 - t1pct}%` }} />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[var(--brass-400)]">Table 1 · {rupee(data.table1.revenue)} · {data.table1.sessions} games</span>
          <span className="text-[var(--cream-300)]">Table 2 · {rupee(data.table2.revenue)} · {data.table2.sessions} games</span>
        </div>
        <div className="brass-line my-3" />
        <div className="flex justify-between text-[11px] text-[var(--cream-300)]/60">
          <span>Pool money: {rupee(data.tableRevenue)}</span>
          <span>Food money: {rupee(data.foodRevenue)}</span>
        </div>
      </div>

      <div className="table-felt rounded-xl p-4 border border-[var(--brass-500)]/20">
        <p className="text-xs font-semibold text-[var(--cream-300)] mb-3 uppercase tracking-wider">🏆 Top Players</p>
        {data.topPlayers.length === 0 ? (
          <p className="text-xs text-[var(--cream-300)]/40 py-4 text-center">No player data yet</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[var(--brass-400)]/70 text-left">
                <th className="pb-2 font-mono-score">#</th>
                <th className="pb-2 font-mono-score">Player</th>
                <th className="pb-2 font-mono-score">Games</th>
                <th className="pb-2 font-mono-score">W/L</th>
                <th className="pb-2 font-mono-score text-right">Spent</th>
              </tr>
            </thead>
            <tbody>
              {data.topPlayers.map((p, i) => (
                <tr key={p.name} className="border-t border-[var(--brass-500)]/10">
                  <td className="py-1.5 text-[var(--cream-300)]/40">{i + 1}</td>
                  <td className="py-1.5 text-[var(--cream-100)]">{p.name}</td>
                  <td className="py-1.5 text-[var(--cream-300)]">{p.games}</td>
                  <td className="py-1.5"><span className="text-[var(--brass-400)]">{p.wins}W</span> / <span className="text-[#e69aa6]">{p.losses}L</span></td>
                  <td className="py-1.5 text-right text-[var(--cream-100)]">{rupee(p.spent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

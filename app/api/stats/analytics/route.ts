import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";

// GET /api/stats/analytics?range=today|week|month
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "today";
  const sql = getSql();

  let sessions: any[];
  let foodOrders: any[];

  if (range === "week") {
    sessions = (await sql`
      SELECT * FROM sessions WHERE status = 'confirmed'
        AND start_time >= (CURRENT_DATE - INTERVAL '6 days')
        AND start_time < (CURRENT_DATE + INTERVAL '1 day') ORDER BY start_time ASC`) as any[];
    foodOrders = (await sql`
      SELECT * FROM food_orders WHERE status = 'confirmed'
        AND created_at >= (CURRENT_DATE - INTERVAL '6 days')
        AND created_at < (CURRENT_DATE + INTERVAL '1 day') ORDER BY created_at ASC`) as any[];
  } else if (range === "month") {
    sessions = (await sql`
      SELECT * FROM sessions WHERE status = 'confirmed'
        AND start_time >= (CURRENT_DATE - INTERVAL '29 days')
        AND start_time < (CURRENT_DATE + INTERVAL '1 day') ORDER BY start_time ASC`) as any[];
    foodOrders = (await sql`
      SELECT * FROM food_orders WHERE status = 'confirmed'
        AND created_at >= (CURRENT_DATE - INTERVAL '29 days')
        AND created_at < (CURRENT_DATE + INTERVAL '1 day') ORDER BY created_at ASC`) as any[];
  } else {
    sessions = (await sql`
      SELECT * FROM sessions WHERE status = 'confirmed'
        AND start_time >= CURRENT_DATE
        AND start_time < (CURRENT_DATE + INTERVAL '1 day') ORDER BY start_time ASC`) as any[];
    foodOrders = (await sql`
      SELECT * FROM food_orders WHERE status = 'confirmed'
        AND created_at >= CURRENT_DATE
        AND created_at < (CURRENT_DATE + INTERVAL '1 day') ORDER BY created_at ASC`) as any[];
  }

  let tableRevenue = 0, sessionFoodRevenue = 0, totalDurationSec = 0;
  const table1 = { revenue: 0, sessions: 0 };
  const table2 = { revenue: 0, sessions: 0 };
  const hourly = new Array(24).fill(0);
  const dailyMap = new Map<string, { pool: number; food: number }>();
  const playerMap = new Map<string, { name: string; games: number; wins: number; losses: number; spent: number }>();

  const dayBucket = (key: string) => {
    let b = dailyMap.get(key);
    if (!b) { b = { pool: 0, food: 0 }; dailyMap.set(key, b); }
    return b;
  };

  const addPlayer = (name: string, spent: number, lost: boolean) => {
    const key = (name || "").toLowerCase().trim();
    if (!key) return;
    const e = playerMap.get(key) || { name: name.trim(), games: 0, wins: 0, losses: 0, spent: 0 };
    e.games++; e.spent += spent;
    if (lost) e.losses++; else e.wins++;
    playerMap.set(key, e);
  };

  for (const s of sessions) {
    const charge = Number(s.table_charge) || 0;
    const food1 = Number(s.food_charge_player1) || 0;
    const food2 = Number(s.food_charge_player2) || 0;
    const total = charge + food1 + food2;

    tableRevenue += charge;
    sessionFoodRevenue += food1 + food2;

    if (s.end_time) {
      const durMs = new Date(s.end_time).getTime() - new Date(s.start_time).getTime();
      totalDurationSec += Math.max(0, Math.round(durMs / 1000) - (Number(s.paused_seconds) || 0));
    }

    if (s.table_no === 1) { table1.revenue += total; table1.sessions++; }
    else if (s.table_no === 2) { table2.revenue += total; table2.sessions++; }

    hourly[new Date(s.start_time).getHours()]++;

    const b = dayBucket(new Date(s.start_time).toISOString().slice(0, 10));
    b.pool += charge;
    b.food += food1 + food2;

    addPlayer(s.player1_name, (s.loser === "player1" ? charge : 0) + food1, s.loser === "player1");
    addPlayer(s.player2_name, (s.loser === "player2" ? charge : 0) + food2, s.loser === "player2");
  }

  let foodOnlyRevenue = 0;
  for (const f of foodOrders) {
    const amt = Number(f.amount) || 0;
    foodOnlyRevenue += amt;
    dayBucket(new Date(f.created_at).toISOString().slice(0, 10)).food += amt;
  }

  const foodRevenue = sessionFoodRevenue + foodOnlyRevenue;
  const totalRevenue = tableRevenue + foodRevenue;
  const sessionCount = sessions.length;
  const avgDurationMin = sessionCount > 0 ? Math.round(totalDurationSec / sessionCount / 60) : 0;

  const peakHourEntry = hourly.map((count, hour) => ({ hour, count }))
    .filter((h) => h.count > 0).sort((a, b) => b.count - a.count)[0];
  const dailyRevenue = Array.from(dailyMap.entries())
    .map(([date, v]) => ({ date, pool: v.pool, food: v.food }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const topPlayers = Array.from(playerMap.values())
    .sort((a, b) => b.games - a.games || b.spent - a.spent).slice(0, 10);

  return NextResponse.json({
    range, totalRevenue, tableRevenue, foodRevenue, sessionCount,
    foodOrderCount: foodOrders.length, avgDurationMin,
    peakHour: peakHourEntry ? peakHourEntry.hour : null,
    table1, table2,
    hourlyDistribution: hourly.map((count, hour) => ({ hour, count })),
    dailyRevenue, topPlayers,
  });
}

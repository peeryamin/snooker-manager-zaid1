import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { calcTableCharge } from "@/lib/billing";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { table_no, player1_name, player2_name, loser, food_charge_player1, food_charge_player2, duration_minutes, start_time } = body;

  if (![1, 2].includes(table_no)) return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  if (!player1_name || !player2_name) return NextResponse.json({ error: "Both player names required" }, { status: 400 });
  if (!["player1", "player2"].includes(loser)) return NextResponse.json({ error: "loser required" }, { status: 400 });

  const sql = getSql();
  const activeSeconds = (Number(duration_minutes) || 0) * 60;
  const tableCharge = calcTableCharge(table_no, activeSeconds);
  const food1 = Number(food_charge_player1) || 0;
  const food2 = Number(food_charge_player2) || 0;

  const startTs = start_time ? new Date(start_time) : new Date();
  const endTs = new Date(startTs.getTime() + activeSeconds * 1000);

  const [row] = await sql`
    INSERT INTO sessions
      (table_no, player1_name, player2_name, status, start_time, end_time,
       paused_seconds, table_charge, loser, food_charge_player1, food_charge_player2, confirmed_at)
    VALUES
      (${table_no}, ${player1_name.trim()}, ${player2_name.trim()}, 'confirmed',
       ${startTs.toISOString()}, ${endTs.toISOString()},
       0, ${tableCharge}, ${loser}, ${food1}, ${food2}, now())
    RETURNING *
  `;

  return NextResponse.json({ session: row });
}

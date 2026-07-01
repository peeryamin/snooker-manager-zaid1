import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { calcTableCharge } from "@/lib/billing";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const sql = getSql();

  const [session] = await sql`SELECT * FROM sessions WHERE id = ${id}`;
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const loser = body.loser ?? session.loser;
  const food1 = body.food_charge_player1 !== undefined ? Number(body.food_charge_player1) : Number(session.food_charge_player1);
  const food2 = body.food_charge_player2 !== undefined ? Number(body.food_charge_player2) : Number(session.food_charge_player2);

  // Recalculate table charge if duration info is available
  let tableCharge = Number(session.table_charge);
  if (body.table_charge !== undefined) {
    tableCharge = Number(body.table_charge);
  } else if (session.end_time && session.start_time) {
    const totalElapsed = Math.floor((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 1000);
    const active = Math.max(totalElapsed - (session.paused_seconds || 0), 0);
    tableCharge = calcTableCharge(session.table_no, active);
  }

  const [row] = await sql`
    UPDATE sessions
    SET loser = ${loser},
        food_charge_player1 = ${food1},
        food_charge_player2 = ${food2},
        table_charge = ${tableCharge}
    WHERE id = ${id}
    RETURNING *
  `;

  return NextResponse.json({ session: row });
}

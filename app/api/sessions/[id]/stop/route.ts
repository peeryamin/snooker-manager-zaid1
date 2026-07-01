import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { calcTableCharge } from "@/lib/billing";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { loser, food_charge_player1, food_charge_player2 } = await req.json();

  if (!["player1", "player2"].includes(loser)) {
    return NextResponse.json({ error: "loser must be 'player1' or 'player2'" }, { status: 400 });
  }

  const sql = getSql();
  const [session] = await sql`SELECT * FROM sessions WHERE id = ${id}`;
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (!["running", "paused"].includes(session.status)) {
    return NextResponse.json({ error: "Session already stopped" }, { status: 409 });
  }

  // If currently paused, account for the ongoing pause duration too
  const extraPauseExpr =
    session.status === "paused"
      ? "EXTRACT(EPOCH FROM (now() - pause_started_at))::INT"
      : "0";

  const rows = (await sql.query(
    `UPDATE sessions
     SET end_time = now(),
         paused_seconds = paused_seconds + ${extraPauseExpr},
         pause_started_at = NULL
     WHERE id = $1
     RETURNING *`,
    [id]
  )) as any[];
  const updated = rows[0];

  const totalElapsedSeconds = Math.floor(
    (new Date(updated.end_time).getTime() - new Date(updated.start_time).getTime()) / 1000
  );
  const activeSeconds = Math.max(totalElapsedSeconds - updated.paused_seconds, 0);
  const tableCharge = calcTableCharge(updated.table_no, activeSeconds);

  const food1 = Number(food_charge_player1) || 0;
  const food2 = Number(food_charge_player2) || 0;

  const [finalRow] = await sql`
    UPDATE sessions
    SET status = 'pending_confirmation',
        table_charge = ${tableCharge},
        loser = ${loser},
        food_charge_player1 = ${food1},
        food_charge_player2 = ${food2}
    WHERE id = ${id}
    RETURNING *
  `;

  return NextResponse.json({ session: finalRow, active_seconds: activeSeconds });
}

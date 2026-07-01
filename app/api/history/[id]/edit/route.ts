import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const sql = getSql();

  const [session] = await sql`SELECT * FROM sessions WHERE id = ${id} AND status = 'confirmed'`;
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const loser = body.loser ?? session.loser;
  const food1 = body.food_charge_player1 !== undefined ? Number(body.food_charge_player1) : Number(session.food_charge_player1);
  const food2 = body.food_charge_player2 !== undefined ? Number(body.food_charge_player2) : Number(session.food_charge_player2);
  const tableCharge = body.table_charge !== undefined ? Number(body.table_charge) : Number(session.table_charge);

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

import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const sql = getSql();
  const rows = await sql`SELECT * FROM sessions WHERE id = ${id}` as any[];
  const session = rows[0];
  if (!session) return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  if (session.status !== "pending_confirmation") return NextResponse.json({ error: "Not pending" }, { status: 409 });
  const food1 = body.food_charge_player1 !== undefined ? Number(body.food_charge_player1) : Number(session.food_charge_player1);
  const food2 = body.food_charge_player2 !== undefined ? Number(body.food_charge_player2) : Number(session.food_charge_player2);
  const row = (await sql`UPDATE sessions SET status='confirmed',confirmed_at=now(),food_charge_player1=${food1},food_charge_player2=${food2} WHERE id=${id} RETURNING *` as any[])[0];
  return NextResponse.json({ session: row });
}

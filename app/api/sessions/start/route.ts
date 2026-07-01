import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { table_no, player1_name, player2_name } = await req.json();
  if (![1,2].includes(table_no)) return NextResponse.json({ error: "Invalid table number" }, { status: 400 });
  if (!player1_name?.trim() || !player2_name?.trim()) return NextResponse.json({ error: "Both player names are required" }, { status: 400 });
  const sql = getSql();
  const existing = (await sql`SELECT id FROM sessions WHERE table_no=${table_no} AND status IN ('running','paused')`) as any[];
  if (existing.length > 0) return NextResponse.json({ error: "This table already has an active session" }, { status: 409 });
  const row = (await sql`INSERT INTO sessions (table_no,player1_name,player2_name,status,start_time) VALUES (${table_no},${player1_name.trim()},${player2_name.trim()},'running',now()) RETURNING *` as any[])[0];
  return NextResponse.json({ session: row });
}

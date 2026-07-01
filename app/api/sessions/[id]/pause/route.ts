import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getSql();

  const [session] = await sql`SELECT * FROM sessions WHERE id = ${id}`;
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (session.status !== "running") {
    return NextResponse.json({ error: "Session is not running" }, { status: 409 });
  }

  const [row] = await sql`
    UPDATE sessions
    SET status = 'paused', pause_started_at = now()
    WHERE id = ${id}
    RETURNING *
  `;
  return NextResponse.json({ session: row });
}

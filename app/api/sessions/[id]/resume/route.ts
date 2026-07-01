import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getSql();
  const rows = await sql`SELECT * FROM sessions WHERE id = ${id}` as any[];
  const session = rows[0];
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (session.status !== "paused") return NextResponse.json({ error: "Session is not paused" }, { status: 409 });
  const updated = (await sql`
    UPDATE sessions
    SET status='running',
        paused_seconds = paused_seconds + EXTRACT(EPOCH FROM (now() - pause_started_at))::INT,
        pause_started_at = NULL
    WHERE id=${id} RETURNING *` as any[])[0];
  return NextResponse.json({ session: updated });
}

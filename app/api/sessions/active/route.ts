import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export async function GET() {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM sessions
    WHERE status IN ('running', 'paused')
    ORDER BY table_no ASC
  `;
  return NextResponse.json({ sessions: rows });
}

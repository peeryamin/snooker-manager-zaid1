import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from"); // YYYY-MM-DD
  const to = searchParams.get("to"); // YYYY-MM-DD

  const sql = getSql();

  let rows;
  if (from && to) {
    rows = await sql`
      SELECT * FROM sessions
      WHERE status = 'confirmed'
        AND start_time >= ${from}::date
        AND start_time < (${to}::date + INTERVAL '1 day')
      ORDER BY start_time DESC
    `;
  } else {
    rows = await sql`
      SELECT * FROM sessions
      WHERE status = 'confirmed'
        AND start_time >= CURRENT_DATE
        AND start_time < (CURRENT_DATE + INTERVAL '1 day')
      ORDER BY start_time DESC
    `;
  }

  return NextResponse.json({ history: rows });
}

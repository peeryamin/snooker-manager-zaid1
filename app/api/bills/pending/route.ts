import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export async function GET() {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM sessions
    WHERE status = 'pending_confirmation'
    ORDER BY end_time DESC
  `;
  return NextResponse.json({ bills: rows });
}

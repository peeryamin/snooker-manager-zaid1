import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const sql = getSql();

  let sessions, foodOrders;
  if (from && to) {
    sessions = await sql`
      SELECT *, 'session' as record_type FROM sessions
      WHERE status = 'confirmed'
        AND start_time >= ${from}::date
        AND start_time < (${to}::date + INTERVAL '1 day')
      ORDER BY start_time DESC
    `;
    foodOrders = await sql`
      SELECT *, 'food' as record_type FROM food_orders
      WHERE status = 'confirmed'
        AND created_at >= ${from}::date
        AND created_at < (${to}::date + INTERVAL '1 day')
      ORDER BY created_at DESC
    `;
  } else {
    sessions = await sql`
      SELECT *, 'session' as record_type FROM sessions
      WHERE status = 'confirmed'
        AND start_time >= CURRENT_DATE
        AND start_time < (CURRENT_DATE + INTERVAL '1 day')
      ORDER BY start_time DESC
    `;
    foodOrders = await sql`
      SELECT *, 'food' as record_type FROM food_orders
      WHERE status = 'confirmed'
        AND created_at >= CURRENT_DATE
        AND created_at < (CURRENT_DATE + INTERVAL '1 day')
      ORDER BY created_at DESC
    `;
  }

  return NextResponse.json({ history: sessions, food_history: foodOrders });
}

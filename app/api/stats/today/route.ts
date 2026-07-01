import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export async function GET() {
  const sql = getSql();

  const sessions = await sql`
    SELECT table_charge, food_charge_player1, food_charge_player2
    FROM sessions
    WHERE status = 'confirmed'
      AND start_time >= CURRENT_DATE
      AND start_time < (CURRENT_DATE + INTERVAL '1 day')
  `;

  const foodOrders = await sql`
    SELECT amount FROM food_orders
    WHERE status = 'confirmed'
      AND created_at >= CURRENT_DATE
      AND created_at < (CURRENT_DATE + INTERVAL '1 day')
  `;

  const sessionRevenue = (sessions as any[]).reduce((sum, s) => {
    return sum + Number(s.table_charge || 0) + Number(s.food_charge_player1 || 0) + Number(s.food_charge_player2 || 0);
  }, 0);

  const foodRevenue = (foodOrders as any[]).reduce((sum, f) => sum + Number(f.amount || 0), 0);

  return NextResponse.json({
    total: sessionRevenue + foodRevenue,
    session_revenue: sessionRevenue,
    food_revenue: foodRevenue,
    session_count: sessions.length,
    food_order_count: foodOrders.length,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export async function GET() {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM food_orders
    WHERE created_at >= CURRENT_DATE
      AND created_at < (CURRENT_DATE + INTERVAL '1 day')
    ORDER BY created_at DESC
  `;
  return NextResponse.json({ orders: rows });
}

export async function POST(req: NextRequest) {
  const { customer_name, items, amount } = await req.json();
  if (!customer_name?.trim()) return NextResponse.json({ error: "Customer name required" }, { status: 400 });

  const sql = getSql();
  const [row] = await sql`
    INSERT INTO food_orders (customer_name, items, amount, status)
    VALUES (${customer_name.trim()}, ${items || ""}, ${Number(amount) || 0}, 'confirmed')
    RETURNING *
  `;
  return NextResponse.json({ order: row });
}

import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { customer_name, items, amount } = await req.json();
  const sql = getSql();

  const [row] = await sql`
    UPDATE food_orders
    SET customer_name = COALESCE(${customer_name || null}, customer_name),
        items = COALESCE(${items !== undefined ? items : null}, items),
        amount = COALESCE(${amount !== undefined ? Number(amount) : null}, amount)
    WHERE id = ${id}
    RETURNING *
  `;
  return NextResponse.json({ order: row });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getSql();
  await sql`DELETE FROM food_orders WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}

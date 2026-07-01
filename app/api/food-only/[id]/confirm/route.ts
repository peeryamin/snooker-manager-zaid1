import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getSql();
  const row = (await sql`UPDATE food_orders SET status='confirmed',confirmed_at=now() WHERE id=${id} RETURNING *` as any[])[0];
  return NextResponse.json({ order: row });
}

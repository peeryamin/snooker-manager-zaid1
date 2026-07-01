import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getSql();
  await sql`DELETE FROM sessions WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}

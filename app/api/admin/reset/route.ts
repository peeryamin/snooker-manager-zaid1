import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";

const ADMIN_PASSWORD = "Zaid990340";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Invalid password" }, { status: 403 });
  }

  const sql = getSql();
  await sql`TRUNCATE TABLE sessions RESTART IDENTITY CASCADE`;
  await sql`TRUNCATE TABLE food_orders RESTART IDENTITY CASCADE`;

  return NextResponse.json({ ok: true, message: "All data has been reset." });
}

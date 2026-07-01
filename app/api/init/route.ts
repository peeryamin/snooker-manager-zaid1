import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export async function GET() {
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      table_no INT NOT NULL CHECK (table_no IN (1, 2)),
      player1_name TEXT NOT NULL,
      player2_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'running',
      start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
      end_time TIMESTAMPTZ,
      paused_seconds INT NOT NULL DEFAULT 0,
      pause_started_at TIMESTAMPTZ,
      table_charge NUMERIC,
      loser TEXT,
      food_charge_player1 NUMERIC NOT NULL DEFAULT 0,
      food_charge_player2 NUMERIC NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      confirmed_at TIMESTAMPTZ
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS food_orders (
      id SERIAL PRIMARY KEY,
      customer_name TEXT NOT NULL,
      items TEXT,
      amount NUMERIC NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      confirmed_at TIMESTAMPTZ
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_food_orders_created ON food_orders(created_at)`;

  return NextResponse.json({ ok: true, message: "Schema initialized" });
}

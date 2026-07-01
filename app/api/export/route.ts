import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") || "today";
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const sql = getSql();
  let rows;

  if (mode === "custom" && from && to) {
    rows = await sql`
      SELECT * FROM sessions
      WHERE status = 'confirmed'
        AND start_time >= ${from}::date
        AND start_time < (${to}::date + INTERVAL '1 day')
      ORDER BY start_time ASC
    `;
  } else {
    rows = await sql`
      SELECT * FROM sessions
      WHERE status = 'confirmed'
        AND start_time >= CURRENT_DATE
        AND start_time < (CURRENT_DATE + INTERVAL '1 day')
      ORDER BY start_time ASC
    `;
  }

  const data = (rows as any[]).map((r) => {
    const tableCharge = Number(r.table_charge) || 0;
    const food1 = Number(r.food_charge_player1) || 0;
    const food2 = Number(r.food_charge_player2) || 0;
    const p1Total = (r.loser === "player1" ? tableCharge : 0) + food1;
    const p2Total = (r.loser === "player2" ? tableCharge : 0) + food2;

    return {
      "Bill ID": r.id,
      "Table": r.table_no,
      "Player 1": r.player1_name,
      "Player 2": r.player2_name,
      "Start Time": new Date(r.start_time).toLocaleString("en-IN"),
      "End Time": r.end_time ? new Date(r.end_time).toLocaleString("en-IN") : "",
      "Loser (pays table)": r.loser === "player1" ? r.player1_name : r.player2_name,
      "Table Charge (Rs)": tableCharge,
      "Food - Player 1 (Rs)": food1,
      "Food - Player 2 (Rs)": food2,
      "Player 1 Total (Rs)": p1Total,
      "Player 2 Total (Rs)": p2Total,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "History");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  const filename =
    mode === "custom" && from && to
      ? `snooker-history_${from}_to_${to}.xlsx`
      : `snooker-history_today.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

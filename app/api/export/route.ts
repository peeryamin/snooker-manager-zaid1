import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") || "today"; // 'today' | 'custom'
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

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("History");

  sheet.columns = [
    { header: "Bill ID", key: "id", width: 10 },
    { header: "Table", key: "table_no", width: 8 },
    { header: "Player 1", key: "player1_name", width: 18 },
    { header: "Player 2", key: "player2_name", width: 18 },
    { header: "Start Time", key: "start_time", width: 20 },
    { header: "End Time", key: "end_time", width: 20 },
    { header: "Loser (pays table)", key: "loser", width: 16 },
    { header: "Table Charge (₹)", key: "table_charge", width: 16 },
    { header: "Food - Player 1 (₹)", key: "food_charge_player1", width: 18 },
    { header: "Food - Player 2 (₹)", key: "food_charge_player2", width: 18 },
    { header: "Player 1 Total (₹)", key: "p1_total", width: 18 },
    { header: "Player 2 Total (₹)", key: "p2_total", width: 18 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const r of rows as any[]) {
    const tableCharge = Number(r.table_charge) || 0;
    const food1 = Number(r.food_charge_player1) || 0;
    const food2 = Number(r.food_charge_player2) || 0;
    const p1Total = (r.loser === "player1" ? tableCharge : 0) + food1;
    const p2Total = (r.loser === "player2" ? tableCharge : 0) + food2;

    sheet.addRow({
      id: r.id,
      table_no: r.table_no,
      player1_name: r.player1_name,
      player2_name: r.player2_name,
      start_time: new Date(r.start_time).toLocaleString("en-IN"),
      end_time: r.end_time ? new Date(r.end_time).toLocaleString("en-IN") : "",
      loser: r.loser === "player1" ? r.player1_name : r.player2_name,
      table_charge: tableCharge,
      food_charge_player1: food1,
      food_charge_player2: food2,
      p1_total: p1Total,
      p2_total: p2Total,
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const filename =
    mode === "custom" && from && to
      ? `snooker-history_${from}_to_${to}.xlsx`
      : `snooker-history_today.xlsx`;

  return new NextResponse(buffer as any, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

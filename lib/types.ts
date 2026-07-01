export type SessionStatus = "running" | "paused" | "pending_confirmation" | "confirmed";

export interface SessionRow {
  id: number;
  table_no: 1 | 2;
  player1_name: string;
  player2_name: string;
  status: SessionStatus;
  start_time: string;
  end_time: string | null;
  paused_seconds: number;
  pause_started_at: string | null;
  table_charge: string | number | null;
  loser: "player1" | "player2" | null;
  food_charge_player1: string | number;
  food_charge_player2: string | number;
  created_at: string;
  confirmed_at: string | null;
}

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  table_no INT NOT NULL CHECK (table_no IN (1, 2)),
  player1_name TEXT NOT NULL,
  player2_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running', -- running | paused | pending_confirmation | confirmed
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,
  paused_seconds INT NOT NULL DEFAULT 0,
  pause_started_at TIMESTAMPTZ,
  table_charge NUMERIC,
  loser TEXT, -- 'player1' | 'player2'
  food_charge_player1 NUMERIC NOT NULL DEFAULT 0,
  food_charge_player2 NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time);

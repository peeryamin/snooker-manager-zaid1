"use client";

import { useEffect, useState, useCallback } from "react";
import { SessionRow } from "@/lib/types";
import StartSessionModal from "./StartSessionModal";
import StopSessionModal from "./StopSessionModal";

const RATES = { 1: { perMin: 5, flat: 100 }, 2: { perMin: 7, flat: 150 } };

function calcLiveCharge(tableNo: 1 | 2, activeSeconds: number) {
  const r = RATES[tableNo];
  const mins = Math.ceil(Math.max(activeSeconds, 0) / 60);
  return Math.max(mins * r.perMin, r.flat);
}

function fmtDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [
    h > 0 ? String(h).padStart(2, "0") : null,
    String(m).padStart(2, "0"),
    String(s).padStart(2, "0"),
  ]
    .filter(Boolean)
    .join(":");
}

// Snooker ball colors
const BALL_COLORS = [
  "#f5e642", // yellow
  "#2e7d32", // green
  "#b71c1c", // red
  "#6a1a9a", // purple
  "#e65100", // orange
  "#0d47a1", // blue
  "#880e4f", // maroon
  "#e53935", // red
  "#e53935", // red
  "#e53935", // red
  "#e53935", // red
  "#e53935", // red
  "#e53935", // red
  "#e53935", // red
  "#f5f5f5", // white (cue ball)
];

// Fixed ball positions on a 340x170 viewBox
const BALL_POSITIONS = [
  { x: 240, y: 85, color: "#f5f5f5", r: 7 },  // cue ball
  // reds triangle
  { x: 105, y: 85, color: "#e53935", r: 7 },
  { x: 118, y: 78, color: "#e53935", r: 7 },
  { x: 118, y: 92, color: "#e53935", r: 7 },
  { x: 131, y: 71, color: "#e53935", r: 7 },
  { x: 131, y: 85, color: "#e53935", r: 7 },
  { x: 131, y: 99, color: "#e53935", r: 7 },
  { x: 144, y: 64, color: "#e53935", r: 7 },
  { x: 144, y: 78, color: "#e53935", r: 7 },
  { x: 144, y: 92, color: "#e53935", r: 7 },
  { x: 144, y: 106, color: "#e53935", r: 7 },
  // colours
  { x: 85, y: 85, color: "#f5e642", r: 7 },   // yellow
  { x: 85, y: 70, color: "#2e7d32", r: 7 },    // green
  { x: 85, y: 100, color: "#b71c1c", r: 7 },   // brown
  { x: 170, y: 85, color: "#0d47a1", r: 7 },   // blue
  { x: 60, y: 85, color: "#880e4f", r: 7 },    // pink
];

function SnookerTableSVG({
  isRunning,
  isPaused,
  activeSeconds,
  liveCharge,
  player1,
  player2,
}: {
  isRunning: boolean;
  isPaused: boolean;
  activeSeconds: number;
  liveCharge: number | null;
  player1?: string;
  player2?: string;
}) {
  const [tick, setTick] = useState(0);
  const hasSession = isRunning || isPaused;

  useEffect(() => {
    if (!isRunning) return;
    const t = setInterval(() => setTick((n) => n + 1), 800);
    return () => clearInterval(t);
  }, [isRunning]);

  // Subtle ball wobble animation offset for running state
  const wobble = (i: number) => {
    if (!isRunning) return 0;
    return Math.sin((tick + i * 1.3) * 0.9) * 1.2;
  };

  return (
    <svg
      viewBox="0 0 340 170"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full rounded-lg"
      style={{ filter: isPaused ? "saturate(0.4) brightness(0.7)" : "none", transition: "filter 0.4s" }}
    >
      {/* Table bed */}
      <defs>
        <radialGradient id={`felt-${isRunning ? "on" : "off"}`} cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor={hasSession ? "#2e7d42" : "#1a4a2a"} />
          <stop offset="100%" stopColor={hasSession ? "#1b5e30" : "#0d2e18"} />
        </radialGradient>
        <filter id="ball-shadow">
          <feDropShadow dx="1" dy="1.5" stdDeviation="1.2" floodColor="#000" floodOpacity="0.5" />
        </filter>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Outer cushion frame */}
      <rect x="4" y="4" width="332" height="162" rx="10" ry="10" fill="#5a3210" />
      {/* Felt */}
      <rect x="18" y="18" width="304" height="134" rx="4" ry="4" fill={`url(#felt-${isRunning ? "on" : "off"})`} />

      {/* Pockets */}
      {[
        [18, 18], [170, 10], [322, 18],
        [18, 152], [170, 160], [322, 152],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="9" fill="#0a0a0a" stroke="#3a1f08" strokeWidth="1.5" />
      ))}

      {/* Baulk line */}
      <line x1="88" y1="18" x2="88" y2="152" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="4,4" />
      {/* D semi-circle */}
      <path d="M88,75 A28,28 0 0,0 88,95" stroke="rgba(255,255,255,0.12)" strokeWidth="1" fill="none" />
      {/* Centre line */}
      <line x1="170" y1="18" x2="170" y2="152" stroke="rgba(255,255,255,0.07)" strokeWidth="0.8" />
      {/* Pink spot */}
      <circle cx="230" cy="85" r="2" fill="rgba(255,255,255,0.25)" />
      {/* Black spot */}
      <circle cx="295" cy="85" r="2" fill="rgba(255,255,255,0.25)" />

      {/* Balls - only show when session active */}
      {hasSession && BALL_POSITIONS.map((b, i) => (
        <g key={i} filter="url(#ball-shadow)" transform={`translate(0, ${wobble(i)})`}>
          <circle cx={b.x} cy={b.y + wobble(i)} r={b.r} fill={b.color} />
          {/* Highlight */}
          <circle cx={b.x - 2} cy={b.y - 2 + wobble(i)} r={b.r * 0.35} fill="rgba(255,255,255,0.45)" />
        </g>
      ))}

      {/* Running pulse ring around cue ball */}
      {isRunning && (
        <circle
          cx={BALL_POSITIONS[0].x}
          cy={BALL_POSITIONS[0].y}
          r={12 + (tick % 2) * 4}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1.5"
          style={{ transition: "r 0.4s ease" }}
        />
      )}

      {/* Session overlay text */}
      {hasSession && (
        <>
          <rect x="170" y="55" width="120" height="60" rx="6" fill="rgba(0,0,0,0.45)" />
          <text x="230" y="78" textAnchor="middle" fill="#fff" fontSize="18" fontFamily="monospace" fontWeight="bold">
            {fmtDuration(activeSeconds)}
          </text>
          <text x="230" y="97" textAnchor="middle" fill="#c9a14a" fontSize="13" fontFamily="monospace">
            ₹{liveCharge?.toFixed(0)}
          </text>
          {isPaused && (
            <text x="230" y="112" textAnchor="middle" fill="#fbbf24" fontSize="9" fontFamily="sans-serif">
              PAUSED
            </text>
          )}
        </>
      )}

      {/* No session placeholder */}
      {!hasSession && (
        <text x="170" y="90" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="11" fontFamily="sans-serif">
          No active session
        </text>
      )}

      {/* Player names at bottom */}
      {hasSession && player1 && player2 && (
        <>
          <text x="88" y="145" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="9" fontFamily="sans-serif">
            {player1.length > 10 ? player1.slice(0, 9) + "…" : player1}
          </text>
          <text x="295" y="145" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="9" fontFamily="sans-serif">
            {player2.length > 10 ? player2.slice(0, 9) + "…" : player2}
          </text>
        </>
      )}
    </svg>
  );
}

export default function TableCard({
  tableNo,
  session,
  onRefresh,
}: {
  tableNo: 1 | 2;
  session: SessionRow | null;
  onRefresh: () => void;
}) {
  const [showStart, setShowStart] = useState(false);
  const [showStop, setShowStop] = useState(false);
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  const calcActive = useCallback(() => {
    if (!session) return 0;
    const start = new Date(session.start_time).getTime();
    const now = Date.now();
    const totalElapsed = Math.floor((now - start) / 1000);
    let paused = session.paused_seconds || 0;
    if (session.status === "paused" && session.pause_started_at) {
      paused += Math.floor((now - new Date(session.pause_started_at).getTime()) / 1000);
    }
    return Math.max(totalElapsed - paused, 0);
  }, [session]);

  useEffect(() => {
    if (!session || !["running", "paused"].includes(session.status)) {
      setActiveSeconds(0);
      return;
    }
    setActiveSeconds(calcActive());
    if (session.status === "running") {
      const interval = setInterval(() => setActiveSeconds(calcActive()), 1000);
      return () => clearInterval(interval);
    }
  }, [session, calcActive]);

  async function handlePause() {
    if (!session) return;
    setActionLoading(true);
    await fetch(`/api/sessions/${session.id}/pause`, { method: "POST" });
    onRefresh();
    setActionLoading(false);
  }

  async function handleResume() {
    if (!session) return;
    setActionLoading(true);
    await fetch(`/api/sessions/${session.id}/resume`, { method: "POST" });
    onRefresh();
    setActionLoading(false);
  }

  const isRunning = session?.status === "running";
  const isPaused = session?.status === "paused";
  const hasSession = isRunning || isPaused;
  const liveCharge = hasSession ? calcLiveCharge(tableNo, activeSeconds) : null;
  const rate = RATES[tableNo];

  return (
    <>
      <div className="table-felt rounded-2xl p-4 flex flex-col gap-3 shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono-score text-xs tracking-widest text-[var(--brass-400)] uppercase">
              Table {tableNo}
            </p>
            <p className="text-xs text-[var(--cream-300)] mt-0.5">
              ₹{rate.perMin}/min · min ₹{rate.flat}
            </p>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
              isRunning
                ? "bg-emerald-900/40 border-emerald-600/50 text-emerald-300 animate-pulse"
                : isPaused
                ? "bg-amber-900/40 border-amber-600/50 text-amber-300"
                : "bg-[var(--felt-900)]/60 border-white/10 text-[var(--cream-300)]"
            }`}
          >
            {isRunning ? "● Live" : isPaused ? "⏸ Paused" : "Available"}
          </span>
        </div>

        {/* SVG Snooker Table */}
        <SnookerTableSVG
          isRunning={isRunning}
          isPaused={isPaused}
          activeSeconds={activeSeconds}
          liveCharge={liveCharge}
          player1={session?.player1_name}
          player2={session?.player2_name}
        />

        {/* Actions */}
        <div className="flex gap-2">
          {!hasSession && (
            <button
              onClick={() => setShowStart(true)}
              className="flex-1 rounded-md py-2.5 bg-[var(--brass-500)] text-[var(--ink)] text-sm font-semibold hover:bg-[var(--brass-400)] transition-colors"
            >
              Start Session
            </button>
          )}
          {isRunning && (
            <>
              <button
                onClick={handlePause}
                disabled={actionLoading}
                className="flex-1 rounded-md py-2.5 bg-amber-800/60 border border-amber-700/50 text-amber-200 text-sm hover:bg-amber-800 transition-colors disabled:opacity-60"
              >
                ⏸ Pause
              </button>
              <button
                onClick={() => setShowStop(true)}
                className="flex-1 rounded-md py-2.5 bg-[var(--red-felt)]/80 border border-[var(--red-felt)] text-[var(--cream-100)] text-sm hover:bg-[var(--red-felt)] transition-colors"
              >
                ■ End Session
              </button>
            </>
          )}
          {isPaused && (
            <>
              <button
                onClick={handleResume}
                disabled={actionLoading}
                className="flex-1 rounded-md py-2.5 bg-emerald-800/60 border border-emerald-700/50 text-emerald-200 text-sm hover:bg-emerald-800 transition-colors disabled:opacity-60"
              >
                ▶ Resume
              </button>
              <button
                onClick={() => setShowStop(true)}
                className="flex-1 rounded-md py-2.5 bg-[var(--red-felt)]/80 border border-[var(--red-felt)] text-[var(--cream-100)] text-sm hover:bg-[var(--red-felt)] transition-colors"
              >
                ■ End Session
              </button>
            </>
          )}
        </div>
      </div>

      {showStart && (
        <StartSessionModal
          tableNo={tableNo}
          onClose={() => setShowStart(false)}
          onStarted={onRefresh}
        />
      )}
      {showStop && session && (
        <StopSessionModal
          session={session}
          onClose={() => setShowStop(false)}
          onStopped={onRefresh}
        />
      )}
    </>
  );
}

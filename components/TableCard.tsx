"use client";

import { useEffect, useState, useCallback, useOptimistic, useTransition } from "react";
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
  return [h > 0 ? String(h).padStart(2, "0") : null, String(m).padStart(2, "0"), String(s).padStart(2, "0")]
    .filter(Boolean).join(":");
}

const BALL_POSITIONS = [
  { x: 240, y: 75, color: "rgba(220,220,210,0.55)", r: 5.5 },
  { x: 105, y: 75, color: "rgba(180,60,60,0.5)", r: 5.5 },
  { x: 116, y: 69, color: "rgba(180,60,60,0.5)", r: 5.5 },
  { x: 116, y: 81, color: "rgba(180,60,60,0.5)", r: 5.5 },
  { x: 127, y: 63, color: "rgba(180,60,60,0.5)", r: 5.5 },
  { x: 127, y: 75, color: "rgba(180,60,60,0.5)", r: 5.5 },
  { x: 127, y: 87, color: "rgba(180,60,60,0.5)", r: 5.5 },
  { x: 82, y: 75, color: "rgba(200,170,60,0.45)", r: 5.5 },
  { x: 82, y: 62, color: "rgba(50,120,60,0.45)", r: 5.5 },
  { x: 82, y: 88, color: "rgba(120,60,40,0.45)", r: 5.5 },
  { x: 168, y: 75, color: "rgba(50,80,160,0.45)", r: 5.5 },
  { x: 218, y: 75, color: "rgba(170,50,120,0.4)", r: 5.5 },
  { x: 290, y: 75, color: "rgba(20,20,20,0.5)", r: 5.5 },
];

function SnookerTableSVG({ isRunning, isPaused, activeSeconds, liveCharge }: {
  isRunning: boolean; isPaused: boolean; activeSeconds: number; liveCharge: number | null;
}) {
  const [tick, setTick] = useState(0);
  const hasSession = isRunning || isPaused;

  useEffect(() => {
    if (!isRunning) return;
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, [isRunning]);

  const wobble = (i: number) => isRunning ? Math.sin((tick + i * 1.5) * 0.7) * 0.8 : 0;

  return (
    <svg viewBox="0 0 340 160" xmlns="http://www.w3.org/2000/svg" className="w-full rounded-lg">
      <defs>
        <radialGradient id="fg" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor={hasSession ? "#2a7040" : "#1a4228"} />
          <stop offset="100%" stopColor={hasSession ? "#185530" : "#0d2818"} />
        </radialGradient>
        <filter id="bs"><feDropShadow dx="0.5" dy="1" stdDeviation="0.8" floodColor="#000" floodOpacity="0.4" /></filter>
      </defs>
      <rect x="2" y="2" width="336" height="118" rx="10" fill="#4a2a0e" />
      <rect x="16" y="14" width="308" height="94" rx="4" fill="url(#fg)" style={{ filter: isPaused ? "saturate(0.3)" : "none", transition: "filter 0.3s" }} />
      {[[16,14],[170,6],[324,14],[16,108],[170,116],[324,108]].map(([cx,cy],i) => (
        <circle key={i} cx={cx} cy={cy} r="9" fill="#080808" stroke="#3a1f06" strokeWidth="1.5" />
      ))}
      <line x1="88" y1="14" x2="88" y2="108" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
      <path d="M88,51 A20,20 0 0,0 88,69" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" fill="none" />
      <line x1="170" y1="14" x2="170" y2="108" stroke="rgba(255,255,255,0.05)" strokeWidth="0.6" />
      <circle cx="230" cy="61" r="1.5" fill="rgba(255,255,255,0.2)" />
      <circle cx="292" cy="61" r="1.5" fill="rgba(255,255,255,0.2)" />

      {hasSession && BALL_POSITIONS.map((b, i) => (
        <g key={i} filter="url(#bs)">
          <circle cx={b.x} cy={b.y + wobble(i)} r={b.r} fill={b.color} />
          <circle cx={b.x - 1.5} cy={b.y - 1.5 + wobble(i)} r={b.r * 0.3} fill="rgba(255,255,255,0.3)" />
        </g>
      ))}
      {isRunning && (
        <circle cx={240} cy={75} r={9 + (tick % 2) * 3} fill="none"
          stroke="rgba(255,255,255,0.12)" strokeWidth="1" style={{ transition: "r 0.5s ease" }} />
      )}

      {/* Timer + charge in clean bottom area */}
      {hasSession && (
        <g>
          <rect x="16" y="122" width="308" height="34" rx="4" fill="rgba(0,0,0,0.25)" />
          <text x="170" y="137" textAnchor="middle" fill="white" fontSize="14"
            fontFamily="monospace" fontWeight="bold" letterSpacing="2">
            {fmtDuration(activeSeconds)}
          </text>
          <text x="170" y="151" textAnchor="middle" fill="#c9a14a" fontSize="11" fontFamily="monospace">
            {isPaused ? "⏸ PAUSED" : `₹${liveCharge?.toFixed(0)}`}
          </text>
        </g>
      )}
      {!hasSession && (
        <text x="170" y="64" textAnchor="middle" fill="rgba(255,255,255,0.18)" fontSize="11" fontFamily="sans-serif">
          No active session
        </text>
      )}
    </svg>
  );
}

export default function TableCard({ tableNo, session, onRefresh }: {
  tableNo: 1 | 2; session: SessionRow | null; onRefresh: () => void;
}) {
  const [showStart, setShowStart] = useState(false);
  const [showStop, setShowStop] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [optimisticSession, setOptimisticSession] = useOptimistic(session);
  const [activeSeconds, setActiveSeconds] = useState(0);

  const calcActive = useCallback((s: SessionRow | null) => {
    if (!s) return 0;
    const start = new Date(s.start_time).getTime();
    const now = Date.now();
    const totalElapsed = Math.floor((now - start) / 1000);
    let paused = s.paused_seconds || 0;
    if (s.status === "paused" && s.pause_started_at) {
      paused += Math.floor((now - new Date(s.pause_started_at).getTime()) / 1000);
    }
    return Math.max(totalElapsed - paused, 0);
  }, []);

  useEffect(() => {
    const s = optimisticSession;
    if (!s || !["running", "paused"].includes(s.status)) { setActiveSeconds(0); return; }
    setActiveSeconds(calcActive(s));
    if (s.status === "running") {
      const interval = setInterval(() => setActiveSeconds(calcActive(s)), 1000);
      return () => clearInterval(interval);
    }
  }, [optimisticSession, calcActive]);

  // Optimistic pause — flips UI instantly, API call in background
  function handlePause() {
    if (!optimisticSession) return;
    startTransition(async () => {
      setOptimisticSession({ ...optimisticSession, status: "paused", pause_started_at: new Date().toISOString() });
      await fetch(`/api/sessions/${optimisticSession.id}/pause`, { method: "POST" });
      onRefresh();
    });
  }

  // Optimistic resume
  function handleResume() {
    if (!optimisticSession) return;
    startTransition(async () => {
      const extraPause = optimisticSession.pause_started_at
        ? Math.floor((Date.now() - new Date(optimisticSession.pause_started_at).getTime()) / 1000)
        : 0;
      setOptimisticSession({
        ...optimisticSession,
        status: "running",
        paused_seconds: (optimisticSession.paused_seconds || 0) + extraPause,
        pause_started_at: null,
      });
      await fetch(`/api/sessions/${optimisticSession.id}/resume`, { method: "POST" });
      onRefresh();
    });
  }

  const isRunning = optimisticSession?.status === "running";
  const isPaused = optimisticSession?.status === "paused";
  const hasSession = isRunning || isPaused;
  const liveCharge = hasSession ? calcLiveCharge(tableNo, activeSeconds) : null;
  const rate = RATES[tableNo];

  return (
    <>
      <div className="table-felt rounded-2xl p-4 flex flex-col gap-3 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono-score text-xs tracking-widest text-[var(--brass-400)] uppercase">Table {tableNo}</p>
            <p className="text-xs text-[var(--cream-300)] mt-0.5">₹{rate.perMin}/min · min ₹{rate.flat}</p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-all ${
            isRunning ? "bg-emerald-900/40 border-emerald-600/50 text-emerald-300 animate-pulse"
            : isPaused ? "bg-amber-900/40 border-amber-600/50 text-amber-300"
            : "bg-[var(--felt-900)]/60 border-white/10 text-[var(--cream-300)]"
          }`}>
            {isRunning ? "● Live" : isPaused ? "⏸ Paused" : "Available"}
          </span>
        </div>

        <SnookerTableSVG isRunning={isRunning} isPaused={isPaused}
          activeSeconds={activeSeconds} liveCharge={liveCharge} />

        {hasSession && optimisticSession && (
          <div className="flex items-center justify-between px-1">
            <div className="flex flex-col items-start">
              <span className="text-[10px] text-[var(--brass-400)] uppercase tracking-widest">Player 1</span>
              <span className="text-base font-bold text-[var(--cream-100)] truncate max-w-[130px]">{optimisticSession.player1_name}</span>
            </div>
            <span className="text-[var(--brass-500)] text-lg font-display">vs</span>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-[var(--brass-400)] uppercase tracking-widest">Player 2</span>
              <span className="text-base font-bold text-[var(--cream-100)] truncate max-w-[130px] text-right">{optimisticSession.player2_name}</span>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {!hasSession && (
            <button onClick={() => setShowStart(true)} disabled={isPending}
              className="flex-1 rounded-md py-2.5 bg-[var(--brass-500)] text-[var(--ink)] text-sm font-semibold hover:bg-[var(--brass-400)] active:scale-95 transition-all disabled:opacity-60">
              Start Session
            </button>
          )}
          {isRunning && (
            <>
              <button onClick={handlePause} disabled={isPending}
                className="flex-1 rounded-md py-2.5 bg-amber-800/60 border border-amber-700/50 text-amber-200 text-sm hover:bg-amber-800 active:scale-95 transition-all disabled:opacity-60">
                ⏸ Pause
              </button>
              <button onClick={() => setShowStop(true)} disabled={isPending}
                className="flex-1 rounded-md py-2.5 bg-[var(--red-felt)]/80 border border-[var(--red-felt)] text-[var(--cream-100)] text-sm hover:bg-[var(--red-felt)] active:scale-95 transition-all">
                ■ End Session
              </button>
            </>
          )}
          {isPaused && (
            <>
              <button onClick={handleResume} disabled={isPending}
                className="flex-1 rounded-md py-2.5 bg-emerald-800/60 border border-emerald-700/50 text-emerald-200 text-sm hover:bg-emerald-800 active:scale-95 transition-all disabled:opacity-60">
                ▶ Resume
              </button>
              <button onClick={() => setShowStop(true)} disabled={isPending}
                className="flex-1 rounded-md py-2.5 bg-[var(--red-felt)]/80 border border-[var(--red-felt)] text-[var(--cream-100)] text-sm hover:bg-[var(--red-felt)] active:scale-95 transition-all">
                ■ End Session
              </button>
            </>
          )}
        </div>
      </div>

      {showStart && (
        <StartSessionModal tableNo={tableNo} onClose={() => setShowStart(false)}
          onStarted={() => { setShowStart(false); onRefresh(); }} />
      )}
      {showStop && optimisticSession && (
        <StopSessionModal session={optimisticSession} onClose={() => setShowStop(false)}
          onStopped={() => { setShowStop(false); onRefresh(); }} />
      )}
    </>
  );
}

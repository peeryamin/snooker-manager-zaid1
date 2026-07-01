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
  return [h > 0 ? String(h).padStart(2, "0") : null, String(m).padStart(2, "0"), String(s).padStart(2, "0")]
    .filter(Boolean)
    .join(":");
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

  // Calculate active seconds from session data
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
      <div className="table-felt rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
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
            className={`text-xs px-2 py-1 rounded-full font-medium border ${
              isRunning
                ? "bg-emerald-900/40 border-emerald-600/50 text-emerald-300"
                : isPaused
                ? "bg-amber-900/40 border-amber-600/50 text-amber-300"
                : "bg-[var(--felt-900)]/60 border-white/10 text-[var(--cream-300)]"
            }`}
          >
            {isRunning ? "● Live" : isPaused ? "⏸ Paused" : "Available"}
          </span>
        </div>

        {/* Snooker table visual */}
        <div className="relative rounded-lg overflow-hidden" style={{ aspectRatio: "2/1" }}>
          <div
            className="absolute inset-0"
            style={{
              background: hasSession
                ? "radial-gradient(ellipse at 50% 30%, #1a6b3c 0%, #0d4d2a 60%, #083020 100%)"
                : "radial-gradient(ellipse at 50% 30%, #0e3a24 0%, #081e14 70%)",
              border: "3px solid #5a3a1a",
              borderRadius: "8px",
            }}
          />
          {/* Cushions */}
          <div className="absolute inset-0 flex flex-col justify-between p-1.5 pointer-events-none">
            {/* Pockets */}
            {[
              { top: "4%", left: "2%" },
              { top: "4%", left: "50%", transform: "translateX(-50%)" },
              { top: "4%", right: "2%" },
              { bottom: "4%", left: "2%" },
              { bottom: "4%", left: "50%", transform: "translateX(-50%)" },
              { bottom: "4%", right: "2%" },
            ].map((style, i) => (
              <div
                key={i}
                className="absolute w-4 h-4 rounded-full bg-[var(--ink)] border border-[#3a2510]"
                style={style}
              />
            ))}
            {/* D zone line */}
            <div className="absolute left-1/4 top-[10%] bottom-[10%] border-l border-dashed border-white/10" />
            {/* Center spot */}
            <div className="absolute w-1.5 h-1.5 bg-pink/30 rounded-full"
              style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "rgba(255,255,255,0.15)" }} />
          </div>

          {/* Session overlay */}
          {hasSession && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <p className="font-mono-score text-2xl font-bold text-white drop-shadow-lg">
                {fmtDuration(activeSeconds)}
              </p>
              <p className="font-mono-score text-sm text-[var(--brass-400)] drop-shadow-md">
                ₹{liveCharge?.toFixed(2)}
              </p>
              {isPaused && (
                <p className="text-xs text-amber-300 mt-1">Session paused</p>
              )}
            </div>
          )}

          {!hasSession && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-[var(--cream-300)]/40 text-sm">No active session</p>
            </div>
          )}
        </div>

        {/* Players */}
        {hasSession && session && (
          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--brass-400)]" />
              <span className="text-[var(--cream-100)]">{session.player1_name}</span>
            </div>
            <span className="text-[var(--cream-300)]/50 text-xs self-center">vs</span>
            <div className="flex items-center gap-2">
              <span className="text-[var(--cream-100)]">{session.player2_name}</span>
              <div className="w-2 h-2 rounded-full bg-white/30" />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          {!hasSession && (
            <button
              onClick={() => setShowStart(true)}
              className="flex-1 rounded-md py-2 bg-[var(--brass-500)] text-[var(--ink)] text-sm font-semibold hover:bg-[var(--brass-400)] transition-colors"
            >
              Start Session
            </button>
          )}
          {isRunning && (
            <>
              <button
                onClick={handlePause}
                disabled={actionLoading}
                className="flex-1 rounded-md py-2 bg-amber-800/60 border border-amber-700/50 text-amber-200 text-sm hover:bg-amber-800 transition-colors disabled:opacity-60"
              >
                Pause
              </button>
              <button
                onClick={() => setShowStop(true)}
                className="flex-1 rounded-md py-2 bg-[var(--red-felt)]/80 border border-[var(--red-felt)] text-[var(--cream-100)] text-sm hover:bg-[var(--red-felt)] transition-colors"
              >
                End Session
              </button>
            </>
          )}
          {isPaused && (
            <>
              <button
                onClick={handleResume}
                disabled={actionLoading}
                className="flex-1 rounded-md py-2 bg-emerald-800/60 border border-emerald-700/50 text-emerald-200 text-sm hover:bg-emerald-800 transition-colors disabled:opacity-60"
              >
                Resume
              </button>
              <button
                onClick={() => setShowStop(true)}
                className="flex-1 rounded-md py-2 bg-[var(--red-felt)]/80 border border-[var(--red-felt)] text-[var(--cream-100)] text-sm hover:bg-[var(--red-felt)] transition-colors"
              >
                End Session
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

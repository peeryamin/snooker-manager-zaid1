"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) { setError(data.error || "Login failed"); return; }
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 min-h-screen relative overflow-hidden">
      {/* Background watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03]">
        <p className="text-[12vw] font-display font-bold text-white text-center leading-tight">
          BLACK<br />RACKS
        </p>
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border-2 border-[var(--brass-500)]/50 mb-4 bg-[var(--felt-800)]">
            <span className="text-2xl">🎱</span>
          </div>
          <h1 className="font-display text-4xl font-bold text-[var(--cream-100)]">
            Welcome, Zaid
          </h1>
          <p className="text-[var(--brass-400)] text-sm mt-1 tracking-wide">
            Black Racks Snooker Club
          </p>
          <div className="brass-line w-32 mx-auto mt-4" />
        </div>

        <form onSubmit={handleSubmit} className="table-felt rounded-xl p-6 space-y-4 shadow-2xl">
          <div>
            <label className="block text-xs text-[var(--cream-300)] mb-1">Username</label>
            <input className="w-full" value={username} onChange={e => setUsername(e.target.value)} autoFocus required />
          </div>
          <div>
            <label className="block text-xs text-[var(--cream-300)] mb-1">Password</label>
            <input type="password" className="w-full" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && (
            <p className="text-sm text-[#e69aa6] bg-[var(--red-felt)]/30 border border-[var(--red-felt)] rounded-md px-3 py-2">{error}</p>
          )}
          <button type="submit" disabled={loading}
            className="w-full rounded-md bg-[var(--brass-500)] text-[var(--ink)] font-semibold py-2.5 hover:bg-[var(--brass-400)] transition-colors disabled:opacity-60">
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-[10px] text-[var(--cream-300)]/30 mt-6 tracking-widest uppercase">
          Black Racks Snooker Club · Management System
        </p>
      </div>
    </main>
  );
}

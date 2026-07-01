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
      if (!res.ok || !data.ok) {
        setError(data.error || "Login failed");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="font-mono-score text-xs tracking-[0.3em] text-[var(--brass-400)] mb-2">
            CUE &amp; LEDGER
          </p>
          <h1 className="font-display text-3xl font-bold text-[var(--cream-100)]">
            Owner Sign In
          </h1>
          <div className="brass-line w-24 mx-auto mt-4" />
        </div>

        <form
          onSubmit={handleSubmit}
          className="table-felt rounded-xl p-6 space-y-4 shadow-2xl"
        >
          <div>
            <label className="block text-xs text-[var(--cream-300)] mb-1">
              Username
            </label>
            <input
              className="w-full"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--cream-300)] mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-[#e69aa6] bg-[var(--red-felt)]/30 border border-[var(--red-felt)] rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-[var(--brass-500)] text-[var(--ink)] font-semibold py-2.5 hover:bg-[var(--brass-400)] transition-colors disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}

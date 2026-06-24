"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed.");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-cream">
      <div className="w-full max-w-[420px] bg-paper border border-rule rounded-2xl p-9 shadow-lg relative">
        <div className="absolute -top-3.5 right-6 -rotate-6 border-2 border-forest text-forest font-bold text-[11px] tracking-widest px-2.5 py-1 rounded-md bg-paper">
          JOB WORK
        </div>
        <div className="text-[11px] tracking-widest uppercase text-ochre font-bold mb-1.5">
          Shivkripa Auto Industries
        </div>
        <h1 className="font-display text-[26px] font-semibold mb-1">Job Work Tracker</h1>
        <p className="text-ink-soft text-[13.5px] mb-6 leading-relaxed">
          Track material dispatched to vendors for heat treatment, machining and plating
          — and exactly how much comes back.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-3.5">
            <label className="field-label">Username</label>
            <input
              className="field-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin or operator"
              autoComplete="username"
            />
          </div>
          <div className="mb-3.5">
            <label className="field-label">Password</label>
            <input
              className="field-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          {error && <div className="text-rust text-[12px] font-semibold mb-3">{error}</div>}
          <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center">
            {loading ? "Signing in…" : "Enter Tracker"}
          </button>
        </form>

        <div className="mt-5 text-[11.5px] text-ink-faint leading-relaxed border-t border-line pt-4">
          First time here? Default logins are <b className="text-ink-soft">admin / admin123</b> and{" "}
          <b className="text-ink-soft">operator / operator123</b>. Change these from Settings after you sign in.
        </div>
      </div>
    </div>
  );
}

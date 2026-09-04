"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus("error");
      setError(error.message);
    } else {
      const next = search.get("next");
      router.replace(next && next.startsWith("/") ? next : "/");
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-black via-violet/90 to-indigo/80 px-6">
      <div className="w-full max-w-sm">
        <p className="font-display font-bold text-3xl text-white mb-1">zeni</p>
        <p className="text-white/70 text-sm mb-8">Watch. Connect. Create.</p>

        <form onSubmit={handleLogin} className="bg-white rounded-xl2 p-6 shadow-deep">
          <h1 className="font-display font-semibold text-lg mb-4">Log in</h1>

          <label className="block text-sm font-medium mb-1.5" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl2 border px-3.5 py-2.5 mb-4 text-sm"
            placeholder="you@example.com"
          />

          <label className="block text-sm font-medium mb-1.5" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl2 border px-3.5 py-2.5 mb-2 text-sm"
            placeholder="••••••••"
          />
          <div className="text-right mb-4">
            <a href="/forgot-password" className="text-xs text-indigo font-medium">Forgot password?</a>
          </div>

          {status === "error" && (
            <p role="alert" className="text-sm text-red-600 mb-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-pill bg-indigo text-white font-medium py-2.5 disabled:opacity-60"
          >
            {status === "loading" ? "Logging in…" : "Log in"}
          </button>

          <p className="text-center text-sm text-[var(--muted)] mt-4">
            New to Zeni? <a href="/signup" className="text-indigo font-medium">Sign up</a>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setStatus("error");
      setError(error.message);
    } else {
      setStatus("success");
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-black via-violet/90 to-indigo/80 px-6">
      <div className="w-full max-w-sm">
        <p className="font-display font-bold text-3xl text-white mb-1">zeni</p>
        <p className="text-white/70 text-sm mb-8">Create your account.</p>

        <div className="bg-white rounded-xl2 p-6 shadow-deep">
          {status === "success" ? (
            <>
              <h1 className="font-display font-semibold text-lg mb-2">Check your email</h1>
              <p className="text-sm text-[var(--muted)] mb-4">
                We sent a confirmation link to {email}. Verify it to finish setting up your account.
              </p>
              <a href="/login" className="text-indigo font-medium text-sm">Back to log in</a>
            </>
          ) : (
            <form onSubmit={handleSignup}>
              <h1 className="font-display font-semibold text-lg mb-4">Sign up</h1>

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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl2 border px-3.5 py-2.5 mb-4 text-sm"
                placeholder="At least 6 characters"
              />

              {status === "error" && (
                <p role="alert" className="text-sm text-red-600 mb-3">{error}</p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-pill bg-indigo text-white font-medium py-2.5 disabled:opacity-60"
              >
                {status === "loading" ? "Creating account…" : "Create account"}
              </button>

              <p className="text-center text-sm text-[var(--muted)] mt-4">
                Already have an account? <a href="/login" className="text-indigo font-medium">Log in</a>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

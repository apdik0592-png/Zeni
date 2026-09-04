"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.auth.resetPasswordForEmail(email);
    setSent(true);
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-black via-violet/90 to-indigo/80 px-6">
      <div className="w-full max-w-sm bg-white rounded-xl2 p-6 shadow-deep">
        <h1 className="font-display font-semibold text-lg mb-2">Reset your password</h1>
        {sent ? (
          <p className="text-sm text-[var(--muted)]">
            If an account exists for {email}, a reset link is on its way.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
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
            <button type="submit" className="w-full rounded-pill bg-indigo text-white font-medium py-2.5">
              Send reset link
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/lib/AuthProvider";

export default function SettingsPage() {
  const { mode, setMode } = useTheme();
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 pt-6 pb-16">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/profile" aria-label="Back" className="text-lg leading-none">
          ←
        </Link>
        <h1 className="font-display font-bold text-2xl">Settings</h1>
      </div>

      <section className="mb-8">
        <h2 className="font-display font-semibold mb-1">Appearance</h2>
        <p className="text-sm text-[var(--muted)] mb-3">Choose how Zeni looks on this device.</p>
        <div className="flex gap-2">
          {([
            ["light", "Light"],
            ["dark", "Dark"],
            ["system", "System"]
          ] as ["light" | "dark" | "system", string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`flex-1 rounded-pill border text-sm font-medium py-2.5 ${
                mode === key ? "bg-indigo text-white border-indigo" : ""
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="font-display font-semibold mb-1">Account</h2>
        <p className="text-sm text-[var(--muted)] mb-3">Manage your profile details.</p>
        <Link href="/profile" className="block rounded-xl2 border px-4 py-3 text-sm font-medium">
          Edit profile
        </Link>
      </section>

      <section className="mb-8">
        <h2 className="font-display font-semibold mb-1">About</h2>
        <p className="text-sm text-[var(--muted)]">Zeni — watch, connect, create.</p>
      </section>

      <button onClick={handleSignOut} className="text-sm text-red-600 font-medium">
        Log out
      </button>
    </div>
  );
}

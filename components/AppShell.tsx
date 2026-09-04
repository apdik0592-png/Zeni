"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ThemeProvider } from "./ThemeProvider";
import Nav from "./Nav";
import TopHeader from "./TopHeader";
import { useAuth } from "@/lib/AuthProvider";

const BARE_ROUTES = ["/login", "/signup", "/onboarding", "/forgot-password"];

function Gate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading } = useAuth();
  const isBare = BARE_ROUTES.some((r) => pathname?.startsWith(r));

  useEffect(() => {
    if (loading) return;
    if (!session && !isBare) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/")}`);
    } else if (session && isBare && pathname !== "/onboarding") {
      router.replace("/");
    }
  }, [loading, session, isBare, pathname, router]);

  if (loading || (!session && !isBare)) {
    return (
      <div className="min-h-screen grid place-items-center bg-[var(--bg)]">
        <span className="w-8 h-8 rounded-full border-2 border-indigo border-t-transparent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBare = BARE_ROUTES.some((r) => pathname?.startsWith(r));
  const isShorts = pathname?.startsWith("/shorts");

  if (isBare) {
    return (
      <ThemeProvider>
        <Gate>{children}</Gate>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <Gate>
        {!isShorts && <TopHeader />}
        <Nav />
        <main className={`md:ml-[76px] lg:ml-[240px] ${isShorts ? "" : "pb-20 md:pb-6"}`}>{children}</main>
      </Gate>
    </ThemeProvider>
  );
}

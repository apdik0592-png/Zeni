"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import { fetchProfile, unreadNotificationCount } from "./api";
import type { Profile } from "./types";

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  unreadCount: number;
  refreshProfile: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  unreadCount: 0,
  refreshProfile: async () => {},
  refreshUnreadCount: async () => {},
  signOut: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadProfile = useCallback(async (userId: string) => {
    const [profileResult, unreadResult] = await Promise.allSettled([
      fetchProfile(userId),
      unreadNotificationCount(userId)
    ]);
    setProfile(profileResult.status === "fulfilled" ? profileResult.value : null);
    setUnreadCount(unreadResult.status === "fulfilled" ? unreadResult.value : 0);
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) {
        loadProfile(data.session.user.id).finally(() => active && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        loadProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id);
  }, [session, loadProfile]);

  const refreshUnreadCount = useCallback(async () => {
    if (!session?.user) return;
    try {
      const n = await unreadNotificationCount(session.user.id);
      setUnreadCount(n);
    } catch {
      /* ignore */
    }
  }, [session]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setUnreadCount(0);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        unreadCount,
        refreshProfile,
        refreshUnreadCount,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

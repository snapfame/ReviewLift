import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export interface AuthProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  system_role: "user" | "super_admin";
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: AuthProfile | null;
  loading: boolean;
  profileReady: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    const apply = (nextSession: Session | null) => {
      if (!active) return;
      const nextUser = nextSession?.user ?? null;
      const nextId = nextUser?.id ?? null;
      const changed = userIdRef.current !== nextId;
      userIdRef.current = nextId;
      setSession(nextSession);
      if (changed) {
        setUser(nextUser);
        setProfile(null);
        setProfileReady(!nextUser);
      }
      setLoading(false);
    };

    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      // Token refresh must not replace the user object. Guards that depend on
      // `user` would otherwise navigate again on every refresh.
      if (event === "TOKEN_REFRESHED") {
        setSession(nextSession);
        return;
      }
      apply(nextSession);
    });

    supabase.auth.getSession().then(({ data: { session: current } }) => {
      apply(current);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setProfileReady(false);
    supabase
      .from("profiles")
      .select("id,full_name,email,system_role")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setProfile(data ? (data as AuthProfile) : null);
        setProfileReady(true);
      })
      .catch(() => {
        if (active) setProfileReady(true);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      profile,
      loading,
      profileReady,
      isSuperAdmin: profile?.system_role === "super_admin",
    }),
    [session, user, profile, loading, profileReady],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

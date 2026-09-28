import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/types";

export type AuthProfile = {
  id: string;
  name: string;
  email: string;
  department: string | null;
  role: AppRole | null;
};

type AuthState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: AuthProfile | null;
  role: AppRole | null;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

async function loadProfile(userId: string): Promise<AuthProfile | null> {
  // ensure_profile() is a security-definer RPC that creates the profile and
  // assigns the demo role on first sign-in.
  await supabase.rpc("ensure_profile");
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);
  if (!profile) return null;
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    department: profile.department,
    role: (roles?.[0]?.role as AppRole | undefined) ?? null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);

  useEffect(() => {
    let active = true;

    const apply = async (next: Session | null) => {
      if (!active) return;
      setSession(next);
      if (next?.user) {
        try {
          const p = await loadProfile(next.user.id);
          if (active) setProfile(p);
        } catch (error) {
          console.error("[auth] profile load failed", error);
        }
      } else {
        setProfile(null);
      }
      if (active) setLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => apply(data.session));

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        void apply(next);
      } else if (event === "INITIAL_SESSION") {
        setSession(next);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value: AuthState = {
    loading,
    session,
    user: session?.user ?? null,
    profile,
    role: profile?.role ?? null,
    signOut: async () => {
      await supabase.auth.signOut();
      setProfile(null);
      setSession(null);
    },
    refresh: async () => {
      if (session?.user) setProfile(await loadProfile(session.user.id));
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function homeRouteFor(role: AppRole | null): string {
  return role === "CANDIDATE" ? "/portal" : "/dashboard";
}

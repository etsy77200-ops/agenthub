"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { raceWithTimeout, readStoredAuthFromLocalStorage, restGetJson } from "@/lib/supabase-rest";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  role: "buyer" | "seller" | "both";
  stripe_account_id?: string;
  /** Set in Supabase (see supabase-admin-secure.sql) — used for Admin nav link */
  is_admin?: boolean;
}

interface AuthContextType {
  user: SupabaseUser | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  /** Re-load profile from Supabase (e.g. after Stripe Connect return). */
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef<SupabaseUser | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const fetchProfileForUserId = useCallback(async (userId: string) => {
    const uid = encodeURIComponent(userId);
    try {
      const rows = await restGetJson<Profile[]>(`profiles?select=*&id=eq.${uid}`, 12000);
      setProfile(rows[0] ?? null);
    } catch {
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const id = userRef.current?.id;
    if (!id) return;
    await fetchProfileForUserId(id);
  }, [fetchProfileForUserId]);

  useEffect(() => {
    const supabase = createClient();
    const snap = readStoredAuthFromLocalStorage();

    // Immediate hydration from the same localStorage login uses (no await — fixes stuck Navbar/dashboard).
    if (snap.user) {
      setUser(snap.user as SupabaseUser);
      setLoading(false);
    }

    const loadSession = async () => {
      let currentUser: SupabaseUser | null = (snap.user as SupabaseUser | null) ?? null;

      try {
        if (snap.access_token && snap.refresh_token) {
          const sessionOutcome = await raceWithTimeout(
            supabase.auth.setSession({
              access_token: snap.access_token,
              refresh_token: snap.refresh_token,
            }),
            4000
          );
          if (sessionOutcome !== "timeout") {
            const { data, error } = sessionOutcome as {
              data: { session: { user: SupabaseUser } | null };
              error: Error | null;
            };
            if (!error && data.session?.user) {
              currentUser = data.session.user;
            }
          }
        }

        if (!currentUser) {
          const sessionOutcome = await raceWithTimeout(supabase.auth.getSession(), 3000);
          if (sessionOutcome !== "timeout") {
            const { data } = sessionOutcome as {
              data: { session: { user: SupabaseUser } | null };
            };
            currentUser = data.session?.user ?? null;
          }
        }

        setUser(currentUser);

        if (currentUser) {
          void fetchProfileForUserId(currentUser.id);
        } else {
          setProfile(null);
        }
      } catch {
        setUser((snap.user as SupabaseUser | null) ?? null);
      } finally {
        setLoading(false);
      }
    };

    void loadSession();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        void fetchProfileForUserId(currentUser.id);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfileForUserId]);

  const signOut = async () => {
    const key = readStoredAuthFromLocalStorage().storageKey ?? undefined;
    if (key) {
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    }
    try {
      const supabase = createClient();
      await raceWithTimeout(supabase.auth.signOut(), 3000);
    } catch {
      /* ignore */
    }
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

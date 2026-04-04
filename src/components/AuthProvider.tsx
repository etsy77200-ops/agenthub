"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  role: "buyer" | "seller" | "both";
  stripe_account_id?: string;
}

interface AuthContextType {
  user: SupabaseUser | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const supabase = createClient();

    // Read session — try getSession first, fall back to localStorage
    const loadSession = async () => {
      let currentUser = null;

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: { session } }: any = await supabase.auth.getSession();
        currentUser = session?.user ?? null;
      } catch {
        // getSession failed, try localStorage
      }

      // Fallback: read directly from localStorage
      if (!currentUser) {
        try {
          const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!.match(/https:\/\/([^.]+)/)?.[1];
          const storageKey = `sb-${projectRef}-auth-token`;
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            const session = JSON.parse(stored);
            currentUser = session.user ?? null;
          }
        } catch {
          // localStorage read failed
        }
      }

      setUser(currentUser);

      if (currentUser) {
        try {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .single();
          setProfile(data);
        } catch {
          // Profile fetch failed
        }
      }

      setLoading(false);
    };

    loadSession();

    // Listen for auth state changes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();
        setProfile(data);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  full_name: string;
  badge_number?: string;
  role: "district_commander" | "unit_supervisor";
  phone?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            await fetchProfile(session.user.id);
          } else {
            setProfile(null);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("Session initialization error:", error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes - clean, non-async handler
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      console.log("Auth state change:", event, session?.user?.email);

      // Handle auth events synchronously to avoid deadlocks
      if (event === "SIGNED_IN" && session) {
        setSession(session);
        setUser(session.user);
        setLoading(false);
        // Fetch profile asynchronously without blocking
        fetchProfile(session.user.id).catch(console.error);
      } else if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
      } else if (event === "TOKEN_REFRESHED" && session) {
        setSession(session);
        setUser(session.user);
        // Don't change loading state for token refresh
      } else if (event === "INITIAL_SESSION") {
        // Handle initial session properly
        if (session) {
          setSession(session);
          setUser(session.user);
          fetchProfile(session.user.id).catch(console.error);
        }
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Profile fetch error:", error);
        throw error;
      }

      setProfile(data || null);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Authentication failed:", error.message);
        setLoading(false); // Only set loading false on error
        throw error;
      }

      // The auth state change listener will handle setting the user state and loading to false
    } catch (error: any) {
      setLoading(false);
      throw new Error(error.message || "Failed to sign in");
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);

      // Clear session data first
      setSession(null);
      setUser(null);
      setProfile(null);

      // Clear all localStorage and sessionStorage
      if (typeof window !== "undefined") {
        // Clear auth-related localStorage
        localStorage.removeItem("madpc-auth-token");
        localStorage.removeItem("sb-madpc-auth-token");

        // Clear all supabase and auth related items
        Object.keys(localStorage).forEach((key) => {
          if (
            key.includes("supabase") ||
            key.includes("auth") ||
            key.includes("madpc")
          ) {
            localStorage.removeItem(key);
          }
        });

        // Clear sessionStorage to prevent cache persistence
        sessionStorage.clear();

        // Clear any cached data in memory
        if ("caches" in window) {
          caches.keys().then((names) => {
            names.forEach((name) => {
              caches.delete(name);
            });
          });
        }
      }

      // Sign out from Supabase with scope 'local' to prevent server-side cache
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message || "Failed to sign out");
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

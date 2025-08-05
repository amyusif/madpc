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
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: "district_commander" | "unit_supervisor",
    badgeNumber?: string,
    phone?: string
  ) => Promise<void>;
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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", { event, session });

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        console.log(
          "User authenticated, fetching profile for:",
          session.user.id
        );
        await fetchProfile(session.user.id);
      } else {
        console.log("No user session, clearing profile");
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log("Fetching profile for user ID:", userId);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      console.log("Profile fetch result:", { data, error });

      if (error && error.code !== "PGRST116") {
        console.error("Profile fetch error:", error);
        throw error;
      }

      if (data) {
        console.log("Profile found:", data);
        setProfile(data);
      } else {
        console.log("No profile found, setting to null");
        setProfile(null);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: "district_commander" | "unit_supervisor",
    badgeNumber?: string,
    phone?: string
  ) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
            badge_number: badgeNumber,
            phone,
          },
        },
      });

      if (error) throw error;

      // Create profile in profiles table
      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: data.user.id,
            full_name: fullName,
            badge_number: badgeNumber,
            role,
            phone,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);

        if (profileError) throw profileError;
      }
    } catch (error: any) {
      throw new Error(error.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      console.log("Attempting Supabase signIn with:", email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("Supabase signIn response:", { data, error });

      if (error) {
        console.error("Supabase signIn error:", error);
        throw error;
      }

      console.log("SignIn successful, user:", data.user);

      // The auth state change listener will handle setting the user state
    } catch (error: any) {
      console.error("SignIn catch block error:", error);
      throw new Error(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
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
    signUp,
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

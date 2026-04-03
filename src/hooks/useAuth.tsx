import React, { createContext, useContext, useEffect, useState } from "react";

type Role = "district_commander" | "unit_supervisor" | string;

interface Profile {
  id: string;
  full_name: string;
  badge_number?: string;
  role: Role;
  phone?: string;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface MinimalUser { id: string; email?: string | null }

interface AuthContextType {
  user: MinimalUser | null;
  profile: Profile | null;
  session: null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Omit<Profile, "id" | "created_at">>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MinimalUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, check current session via cookie
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setUser({ id: data.user.sub, email: data.user.email });
          // Fetch profile from personnel
          return fetch(`/api/profiles/${data.user.sub}`).then((r) => r.json());
        }
        return null;
      })
      .then((data) => {
        if (data?.profile) {
          setProfile(data.profile);
        }
      })
      .catch(() => {
        // unauthenticated; leave user/profile null
      })
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sign in");

      const u = { id: data.id, email: data.email };
      setUser(u);

      // Fetch profile
      const profileRes = await fetch(`/api/profiles/${data.id}`);
      const profileData = await profileRes.json();
      if (profileData.profile) setProfile(profileData.profile);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setProfile(null);
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
        if ("caches" in window) {
          caches.keys().then((names) => names.forEach((n) => caches.delete(n)));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Omit<Profile, "id" | "created_at">>) => {
    if (!user?.id) throw new Error("No user authenticated");

    const res = await fetch(`/api/profiles/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update profile");

    setProfile((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const value: AuthContextType = { user, profile, session: null, loading, signIn, signOut, updateProfile };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}


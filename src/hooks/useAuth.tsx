import React, { createContext, useContext, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut as fbSignOut, User as FbUser } from "firebase/auth";
import { getDb, getFirebaseApp } from "@/integrations/firebase/client";
import { doc, getDoc, setDoc } from "firebase/firestore";

type Role = "district_commander" | "unit_supervisor";

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MinimalUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const app = getFirebaseApp();
    const auth = getAuth(app);
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const u = { id: fbUser.uid, email: fbUser.email };
        setUser(u);
        await fetchProfile(fbUser);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const fetchProfile = async (fbUser: FbUser) => {
    try {
      const db = getDb();
      const ref = doc(db, "profiles", fbUser.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setProfile({ id: fbUser.uid, ...(snap.data() as any) });
      } else {
        // Seed minimal profile if missing
        const seed: Profile = {
          id: fbUser.uid,
          full_name: fbUser.email || "User",
          role: "unit_supervisor",
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await setDoc(ref, seed);
        setProfile(seed);
      }
    } catch (e) {
      console.error("Profile fetch error:", e);
      setProfile(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const auth = getAuth(getFirebaseApp());
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will update state
    } catch (e: any) {
      setLoading(false);
      throw new Error(e?.message || "Failed to sign in");
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const auth = getAuth(getFirebaseApp());
      await fbSignOut(auth);
      setUser(null);
      setProfile(null);
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
        if ("caches" in window) {
          caches.keys().then((names) => names.forEach((n) => caches.delete(n)));
        }
      }
    } catch (e: any) {
      throw new Error(e?.message || "Failed to sign out");
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = { user, profile, session: null, loading, signIn, signOut };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

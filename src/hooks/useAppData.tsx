import React, { createContext, useContext, useEffect, useState } from "react";
import { supabaseHelpers } from "@/integrations/supabase/client";
import type { Personnel, Case, Duty } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface AppDataContextType {
  personnel: Personnel[];
  cases: Case[];
  duties: Duty[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  refreshPersonnel: () => Promise<void>;
  refreshCases: () => Promise<void>;
  refreshDuties: () => Promise<void>;
  stats: {
    totalPersonnel: number;
    activeCases: number;
    pendingDuties: number;
    activeAlerts: number;
  };
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [duties, setDuties] = useState<Duty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchPersonnel = async () => {
    try {
      const data = await supabaseHelpers.getPersonnel();
      setPersonnel(data);
    } catch (error: any) {
      console.error("Error fetching personnel:", error);
      throw error;
    }
  };

  const fetchCases = async () => {
    try {
      const data = await supabaseHelpers.getCases();
      setCases(data);
    } catch (error: any) {
      console.error("Error fetching cases:", error);
      throw error;
    }
  };

  const fetchDuties = async () => {
    try {
      const data = await supabaseHelpers.getDuties();
      setDuties(data);
    } catch (error: any) {
      console.error("Error fetching duties:", error);
      throw error;
    }
  };

  const refreshData = async () => {
    if (!user) return;

    setError(null);

    try {
      // Fetch data in parallel without showing loading spinner
      await Promise.all([fetchPersonnel(), fetchCases(), fetchDuties()]);
    } catch (error: any) {
      setError(error.message || "Failed to fetch data");
    }
  };

  const refreshPersonnel = async () => {
    try {
      await fetchPersonnel();
    } catch (error: any) {
      setError(error.message || "Failed to fetch personnel");
    }
  };

  const refreshCases = async () => {
    try {
      await fetchCases();
    } catch (error: any) {
      setError(error.message || "Failed to fetch cases");
    }
  };

  const refreshDuties = async () => {
    try {
      await fetchDuties();
    } catch (error: any) {
      setError(error.message || "Failed to fetch duties");
    }
  };

  // Calculate stats from the data
  const stats = {
    totalPersonnel: personnel.filter((p) => p.status === "active").length,
    activeCases: cases.filter((c) => c.status === "open").length,
    pendingDuties: duties.filter((d) => d.status === "scheduled").length,
    activeAlerts: 0, // This would come from alerts collection when implemented
  };

  // Fetch data when user logs in
  useEffect(() => {
    if (user) {
      // Start with no loading state, fetch data in background
      setLoading(false);
      refreshData();
    } else {
      // Clear data when user logs out
      setPersonnel([]);
      setCases([]);
      setDuties([]);
      setLoading(false);
    }
  }, [user]);

  const value: AppDataContextType = {
    personnel,
    cases,
    duties,
    loading,
    error,
    refreshData,
    refreshPersonnel,
    refreshCases,
    refreshDuties,
    stats,
  };

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }
  return context;
}

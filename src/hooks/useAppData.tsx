import React, { createContext, useContext, useEffect, useState } from "react";
import { db } from "@/integrations/database";
import type { Personnel, Case, Duty, Convict } from "@/integrations/database";
import { useAuth } from "./useAuth";

interface AppDataContextType {
  personnel: Personnel[];
  cases: Case[];
  duties: Duty[];
  convicts: Convict[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  refreshPersonnel: () => Promise<void>;
  refreshCases: () => Promise<void>;
  refreshDuties: () => Promise<void>;
  refreshConvicts: () => Promise<void>;
  stats: {
    totalPersonnel: number;
    activeCases: number;
    pendingDuties: number;
    activeAlerts: number;
    totalConvicts: number;
  };
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [duties, setDuties] = useState<Duty[]>([]);
  const [convicts, setConvicts] = useState<Convict[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchPersonnel = async () => {
    try {
      console.log("Fetching personnel from database...");
      const data = await db.getPersonnel();
      console.log(`Fetched ${data.length} personnel records`);
      setPersonnel(data);
    } catch (error: any) {
      console.error("Error fetching personnel:", error);
      throw error;
    }
  };

  const fetchCases = async () => {
    try {
      const data = await db.getCases();
      setCases(data);
    } catch (error: any) {
      console.error("Error fetching cases:", error);
      throw error;
    }
  };

  const fetchDuties = async () => {
    try {
      const data = await db.getDuties();
      setDuties(data || []);
    } catch (error: any) {
      console.error("Error fetching duties:", error);
      if (error.message?.includes('relation "duties" does not exist')) {
        console.warn("Duties table does not exist. Please run the database setup script.");
        setDuties([]);
        return;
      }
      throw error;
    }
  };

  const fetchConvicts = async () => {
    try {
      const data = await db.getConvicts();
      setConvicts(data || []);
    } catch (error: any) {
      console.error("Error fetching convicts:", error);
      setConvicts([]);
    }
  };

  const refreshData = async () => {
    if (!user) return;

    setError(null);

    try {
      const results = await Promise.allSettled([
        fetchPersonnel(),
        fetchCases(),
        fetchDuties(),
        fetchConvicts(),
      ]);

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          const dataType = ["personnel", "cases", "duties", "convicts"][index];
          console.error(`Failed to fetch ${dataType}:`, result.reason);
        }
      });

      const allFailed = results.every((result) => result.status === "rejected");
      if (allFailed) {
        setError("Failed to fetch data from database");
      }
    } catch (error: any) {
      console.error("Unexpected error in refreshData:", error);
      setError(error.message || "Failed to fetch data");
    }
  };

  const refreshPersonnel = async () => {
    try {
      console.log("Refreshing personnel data...");
      await fetchPersonnel();
      console.log("Personnel data refreshed successfully");
    } catch (error: any) {
      console.error("Failed to refresh personnel:", error);
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
      console.error("Failed to refresh duties:", error);
      if (!error.message?.includes('relation "duties" does not exist')) {
        setError(error.message || "Failed to fetch duties");
      }
    }
  };

  const refreshConvicts = async () => {
    try {
      await fetchConvicts();
    } catch (error: any) {
      console.error("Failed to refresh convicts:", error);
    }
  };

  const stats = {
    totalPersonnel: personnel.length,
    activeCases: cases.filter((c) => c.status === "open" || c.status === "in_progress").length,
    pendingDuties: duties.filter((d) => d.status !== "completed" && d.status !== "cancelled").length,
    activeAlerts: 0,
    totalConvicts: convicts.length,
  };

  useEffect(() => {
    if (user) {
      setLoading(false);
      refreshData();

      const intervalId = setInterval(() => {
        console.log("Auto-refreshing data...");
        refreshData();
      }, 30000);

      return () => {
        clearInterval(intervalId);
      };
    } else {
      setPersonnel([]);
      setCases([]);
      setDuties([]);
      setConvicts([]);
      setLoading(false);
    }
  }, [user]);

  const value: AppDataContextType = {
    personnel,
    cases,
    duties,
    convicts,
    loading,
    error,
    refreshData,
    refreshPersonnel,
    refreshCases,
    refreshDuties,
    refreshConvicts,
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

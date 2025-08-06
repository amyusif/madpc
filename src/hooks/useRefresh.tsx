import React, { createContext, useContext, useState, useCallback } from "react";
import { useAppData } from "./useAppData";
import { useToast } from "./use-toast";

interface RefreshContextType {
  isRefreshing: boolean;
  refreshAll: () => Promise<void>;
  refreshPersonnel: () => Promise<void>;
  refreshCases: () => Promise<void>;
  refreshDuties: () => Promise<void>;
  autoRefresh: boolean;
  setAutoRefresh: (enabled: boolean) => void;
  triggerAutoRefresh: () => void;
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export function RefreshProvider({ children }: { children: React.ReactNode }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { refreshData, refreshPersonnel: refreshPersonnelData, refreshCases: refreshCasesData, refreshDuties: refreshDutiesData } = useAppData();
  const { toast } = useToast();

  const showRefreshToast = (message: string) => {
    toast({
      title: "🔄 Data Refreshed",
      description: message,
      duration: 2000,
    });
  };

  const refreshAll = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      console.log("Manual refresh triggered - refreshing all data");
      await refreshData();
      showRefreshToast("All data has been refreshed successfully");
    } catch (error) {
      console.error("Error during manual refresh:", error);
      toast({
        title: "❌ Refresh Failed",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, refreshData, toast]);

  const refreshPersonnel = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      console.log("Refreshing personnel data");
      await refreshPersonnelData();
      showRefreshToast("Personnel data refreshed");
    } catch (error) {
      console.error("Error refreshing personnel:", error);
      toast({
        title: "❌ Refresh Failed",
        description: "Failed to refresh personnel data.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, refreshPersonnelData, toast]);

  const refreshCases = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      console.log("Refreshing cases data");
      await refreshCasesData();
      showRefreshToast("Cases data refreshed");
    } catch (error) {
      console.error("Error refreshing cases:", error);
      toast({
        title: "❌ Refresh Failed",
        description: "Failed to refresh cases data.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, refreshCasesData, toast]);

  const refreshDuties = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      console.log("Refreshing duties data");
      await refreshDutiesData();
      showRefreshToast("Duties data refreshed");
    } catch (error) {
      console.error("Error refreshing duties:", error);
      toast({
        title: "❌ Refresh Failed",
        description: "Failed to refresh duties data.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, refreshDutiesData, toast]);

  const triggerAutoRefresh = useCallback(() => {
    if (autoRefresh && !isRefreshing) {
      console.log("Auto-refresh triggered");
      refreshAll();
    }
  }, [autoRefresh, isRefreshing, refreshAll]);

  const value: RefreshContextType = {
    isRefreshing,
    refreshAll,
    refreshPersonnel,
    refreshCases,
    refreshDuties,
    autoRefresh,
    setAutoRefresh,
    triggerAutoRefresh,
  };

  return (
    <RefreshContext.Provider value={value}>
      {children}
    </RefreshContext.Provider>
  );
}

export function useRefresh() {
  const context = useContext(RefreshContext);
  if (context === undefined) {
    throw new Error("useRefresh must be used within a RefreshProvider");
  }
  return context;
}

// Helper hook for triggering auto-refresh after operations
export function useAutoRefresh() {
  const { triggerAutoRefresh } = useRefresh();
  
  return useCallback((delay: number = 1000) => {
    setTimeout(() => {
      triggerAutoRefresh();
    }, delay);
  }, [triggerAutoRefresh]);
}

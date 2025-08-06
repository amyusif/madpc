import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://rhvzegaftwyqeigjxvok.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJodnplZ2FmdHd5cWVpZ2p4dm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5Njg1NzMsImV4cCI6MjA2ODU0NDU3M30.81MwyyxADYyMHijUAHxL7cGXqAjgI4Qy93Y7WYT5MfQ";

// Create stable Supabase client with proper session management
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true, // Enable auto refresh for stable sessions
    persistSession: true, // Enable session persistence
    detectSessionInUrl: false, // Disable to prevent session reset bug (v2.66.1+)
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    storageKey: "madpc-auth-token",
    flowType: "pkce",
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Session management utilities
export const sessionUtils = {
  // Clear stale session data and cache
  clearStaleSession: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("madpc-auth-token");
      localStorage.removeItem("sb-madpc-auth-token");

      // Clear any other auth-related items
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

      // Clear browser cache
      if ("caches" in window) {
        caches
          .keys()
          .then((names) => {
            names.forEach((name) => {
              caches.delete(name);
            });
          })
          .catch(console.error);
      }

      console.log("Cleared stale session data and cache");
    }
  },

  // Debug session state
  debugSession: async () => {
    if (typeof window !== "undefined") {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      console.log("Current session:", session);
      console.log("Session error:", error);
      console.log(
        "LocalStorage auth data:",
        localStorage.getItem("madpc-auth-token")
      );
    }
  },
};

// Database types for TypeScript
export interface Personnel {
  id: string;
  badge_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  rank: string;
  unit: string;
  date_joined: string;
  emergency_contacts: string[];
  marital_status: string;
  spouse?: string;
  children_count?: number;
  no_children?: boolean;
  status: "active" | "inactive" | "suspended" | "retired";
  created_at: string;
  updated_at: string;
}

export interface Case {
  id: string;
  case_number: string;
  case_title: string;
  case_type: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "closed" | "archived";
  assigned_to?: string;
  reported_by: string;
  created_at: string;
  updated_at: string;
}

export interface Duty {
  id: string;
  personnel_id: string;
  duty_type: string;
  description: string;
  location: string;
  start_time: string;
  end_time?: string;
  status: "scheduled" | "assigned" | "in_progress" | "completed" | "cancelled";
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  priority: "low" | "medium" | "high" | "urgent";
  status: "active" | "resolved" | "dismissed";
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Helper functions for common operations
export const supabaseHelpers = {
  // Personnel operations
  async getPersonnel() {
    const { data, error } = await supabase
      .from("personnel")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Personnel[];
  },

  async createPersonnel(
    personnel: Omit<Personnel, "id" | "created_at" | "updated_at">
  ) {
    const { data, error } = await supabase
      .from("personnel")
      .insert([
        {
          ...personnel,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data as Personnel;
  },

  async updatePersonnel(
    personnelId: string,
    personnel: Partial<Omit<Personnel, "id" | "created_at">>
  ) {
    const { data, error } = await supabase
      .from("personnel")
      .update({
        ...personnel,
        updated_at: new Date().toISOString(),
      })
      .eq("id", personnelId)
      .select()
      .single();

    if (error) throw error;
    return data as Personnel;
  },

  async deletePersonnel(personnelId: string) {
    const { error } = await supabase
      .from("personnel")
      .delete()
      .eq("id", personnelId);

    if (error) throw error;
    return { success: true };
  },

  // Cases operations
  async getCases() {
    const { data, error } = await supabase
      .from("cases")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Case[];
  },

  async createCase(caseData: Omit<Case, "id" | "created_at" | "updated_at">) {
    const { data, error } = await supabase
      .from("cases")
      .insert([
        {
          ...caseData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data as Case;
  },

  async deleteCase(caseId: string) {
    const { error } = await supabase.from("cases").delete().eq("id", caseId);

    if (error) throw error;
    return { success: true };
  },

  // Duties operations
  async getDuties() {
    const { data, error } = await supabase
      .from("duties")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Duty[];
  },

  async createDuty(duty: Omit<Duty, "id" | "created_at" | "updated_at">) {
    const { data, error } = await supabase
      .from("duties")
      .insert([
        {
          ...duty,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data as Duty;
  },

  // Alerts operations
  async getAlerts() {
    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Alert[];
  },

  async createAlert(alert: Omit<Alert, "id" | "created_at" | "updated_at">) {
    const { data, error } = await supabase
      .from("alerts")
      .insert([
        {
          ...alert,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data as Alert;
  },
};

export default supabase;

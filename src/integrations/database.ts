import { firestoreHelpers } from "./firebase/helpers";

// Unified database interface using Firebase Firestore
export const db = {
  // Personnel operations
  async getPersonnel() {
    return firestoreHelpers.getPersonnel();
  },

  async createPersonnel(personnel: any) {
    return firestoreHelpers.createPersonnel(personnel);
  },

  async updatePersonnel(id: string, personnel: any) {
    return firestoreHelpers.updatePersonnel(id, personnel);
  },

  async deletePersonnel(id: string) {
    return firestoreHelpers.deletePersonnel(id);
  },

  // Cases operations
  async getCases() {
    return firestoreHelpers.getCases();
  },

  async createCase(caseData: any) {
    return firestoreHelpers.createCase(caseData);
  },

  async deleteCase(id: string) {
    return firestoreHelpers.deleteCase(id);
  },

  // Duties operations
  async getDuties() {
    return firestoreHelpers.getDuties();
  },

  async createDuty(duty: any) {
    return firestoreHelpers.createDuty(duty);
  },

  async updateDuty(id: string, duty: any) {
    return firestoreHelpers.updateDuty(id, duty);
  },

  async deleteDuty(id: string) {
    return firestoreHelpers.deleteDuty(id);
  },

  // Utility functions
  getCurrentBackend() {
    return "Firebase Firestore";
  }
};

// Export types for convenience
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
  photo_url?: string;
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

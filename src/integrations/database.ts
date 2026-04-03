// Environment-safe database integration:
// - Browser: calls Next.js API routes
// - Server: uses Prisma directly

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

function isBrowser() {
  return typeof window !== "undefined";
}

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error || `Request failed (${res.status})`);
  }
  return payload as T;
}

// Unified database interface using Prisma + Neon (PostgreSQL)
export const db = {
  // Personnel operations
  async getPersonnel(): Promise<Personnel[]> {
    if (isBrowser()) {
      const result = await apiRequest<{ data: Personnel[] }>("/api/personnel");
      return result.data;
    }

    const prisma = await getPrisma();
    const rows = await prisma.personnel.findMany({ orderBy: { created_at: "desc" } });
    return rows.map(serializePersonnel);
  },

  async createPersonnel(personnel: Omit<Personnel, "id" | "created_at" | "updated_at">): Promise<Personnel> {
    if (isBrowser()) {
      const result = await apiRequest<{ data: Personnel }>("/api/personnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(personnel),
      });
      return result.data;
    }

    const prisma = await getPrisma();
    const row = await prisma.personnel.create({
      data: {
        badge_number: personnel.badge_number,
        first_name: personnel.first_name,
        last_name: personnel.last_name,
        email: personnel.email,
        phone: personnel.phone ?? null,
        rank: personnel.rank,
        unit: personnel.unit,
        date_joined: personnel.date_joined,
        emergency_contacts: personnel.emergency_contacts ?? [],
        marital_status: personnel.marital_status,
        spouse: personnel.spouse ?? null,
        children_count: personnel.children_count ?? null,
        no_children: personnel.no_children ?? false,
        status: personnel.status as any,
        photo_url: personnel.photo_url ?? null,
        password_hash: (personnel as any).password_hash ?? null,
      },
    });
    return serializePersonnel(row);
  },

  async updatePersonnel(id: string, personnel: Partial<Omit<Personnel, "id" | "created_at">>): Promise<Personnel> {
    if (isBrowser()) {
      const result = await apiRequest<{ data: Personnel }>(`/api/personnel/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(personnel),
      });
      return result.data;
    }

    const prisma = await getPrisma();
    const row = await prisma.personnel.update({
      where: { id },
      data: {
        ...(personnel.badge_number !== undefined && { badge_number: personnel.badge_number }),
        ...(personnel.first_name !== undefined && { first_name: personnel.first_name }),
        ...(personnel.last_name !== undefined && { last_name: personnel.last_name }),
        ...(personnel.email !== undefined && { email: personnel.email }),
        ...(personnel.phone !== undefined && { phone: personnel.phone }),
        ...(personnel.rank !== undefined && { rank: personnel.rank }),
        ...(personnel.unit !== undefined && { unit: personnel.unit }),
        ...(personnel.date_joined !== undefined && { date_joined: personnel.date_joined }),
        ...(personnel.emergency_contacts !== undefined && { emergency_contacts: personnel.emergency_contacts }),
        ...(personnel.marital_status !== undefined && { marital_status: personnel.marital_status }),
        ...(personnel.spouse !== undefined && { spouse: personnel.spouse }),
        ...(personnel.children_count !== undefined && { children_count: personnel.children_count }),
        ...(personnel.no_children !== undefined && { no_children: personnel.no_children }),
        ...(personnel.status !== undefined && { status: personnel.status as any }),
        ...(personnel.photo_url !== undefined && { photo_url: personnel.photo_url }),
        ...((personnel as any).password_hash !== undefined && { password_hash: (personnel as any).password_hash }),
      },
    });
    return serializePersonnel(row);
  },

  async deletePersonnel(id: string) {
    if (isBrowser()) {
      await apiRequest<{ success: boolean }>(`/api/personnel/${id}`, { method: "DELETE" });
      return { success: true };
    }

    const prisma = await getPrisma();
    await prisma.personnel.delete({ where: { id } });
    return { success: true };
  },

  // Cases operations
  async getCases(): Promise<Case[]> {
    if (isBrowser()) {
      const result = await apiRequest<{ data: Case[] }>("/api/cases");
      return result.data;
    }

    const prisma = await getPrisma();
    const rows = await prisma.case.findMany({ orderBy: { created_at: "desc" } });
    return rows.map(serializeCase);
  },

  async createCase(caseData: Omit<Case, "id" | "created_at" | "updated_at">): Promise<Case> {
    if (isBrowser()) {
      const result = await apiRequest<{ data: Case }>("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(caseData),
      });
      return result.data;
    }

    const prisma = await getPrisma();
    const row = await prisma.case.create({
      data: {
        case_number: caseData.case_number,
        case_title: caseData.case_title,
        case_type: caseData.case_type,
        description: caseData.description,
        priority: caseData.priority as any,
        status: caseData.status as any,
        assigned_to: caseData.assigned_to ?? null,
        reported_by: caseData.reported_by,
      },
    });
    return serializeCase(row);
  },

  async deleteCase(id: string) {
    if (isBrowser()) {
      await apiRequest<{ success: boolean }>(`/api/cases/${id}`, { method: "DELETE" });
      return { success: true };
    }

    const prisma = await getPrisma();
    await prisma.case.delete({ where: { id } });
    return { success: true };
  },

  // Duties operations
  async getDuties(): Promise<Duty[]> {
    if (isBrowser()) {
      const result = await apiRequest<{ data: Duty[] }>("/api/duties");
      return result.data;
    }

    const prisma = await getPrisma();
    const rows = await prisma.duty.findMany({ orderBy: { created_at: "desc" } });
    return rows.map(serializeDuty);
  },

  async createDuty(duty: Omit<Duty, "id" | "created_at" | "updated_at">): Promise<Duty> {
    if (isBrowser()) {
      const result = await apiRequest<{ data: Duty }>("/api/duties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duty),
      });
      return result.data;
    }

    const prisma = await getPrisma();
    const row = await prisma.duty.create({
      data: {
        personnel_id: duty.personnel_id,
        duty_type: duty.duty_type,
        description: duty.description,
        location: duty.location,
        start_time: duty.start_time,
        end_time: duty.end_time ?? null,
        status: duty.status as any,
        notes: duty.notes ?? null,
      },
    });
    return serializeDuty(row);
  },

  async updateDuty(id: string, duty: Partial<Omit<Duty, "id" | "created_at">>): Promise<Duty> {
    if (isBrowser()) {
      const result = await apiRequest<{ data: Duty }>(`/api/duties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duty),
      });
      return result.data;
    }

    const prisma = await getPrisma();
    const row = await prisma.duty.update({
      where: { id },
      data: {
        ...(duty.personnel_id !== undefined && { personnel_id: duty.personnel_id }),
        ...(duty.duty_type !== undefined && { duty_type: duty.duty_type }),
        ...(duty.description !== undefined && { description: duty.description }),
        ...(duty.location !== undefined && { location: duty.location }),
        ...(duty.start_time !== undefined && { start_time: duty.start_time }),
        ...(duty.end_time !== undefined && { end_time: duty.end_time }),
        ...(duty.status !== undefined && { status: duty.status as any }),
        ...(duty.notes !== undefined && { notes: duty.notes }),
      },
    });
    return serializeDuty(row);
  },

  async deleteDuty(id: string) {
    if (isBrowser()) {
      await apiRequest<{ success: boolean }>(`/api/duties/${id}`, { method: "DELETE" });
      return { success: true };
    }

    const prisma = await getPrisma();
    await prisma.duty.delete({ where: { id } });
    return { success: true };
  },

  getCurrentBackend() {
    return "Neon (PostgreSQL) via Prisma";
  },
};

// Serializers: convert Prisma Date objects to ISO strings for the existing interfaces
function serializePersonnel(row: any): Personnel {
  return {
    ...row,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

function serializeCase(row: any): Case {
  return {
    ...row,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

function serializeDuty(row: any): Duty {
  return {
    ...row,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

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
  photo_url?: string | null;
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

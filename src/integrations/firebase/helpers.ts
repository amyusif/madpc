import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { getDb } from "./client";
import type { Personnel, Case, Duty } from "@/integrations/supabase/client";

const PERSONNEL = "personnel";
const CASES = "cases";
const DUTIES = "duties";

export const firestoreHelpers = {
  async getPersonnel(): Promise<Personnel[]> {
    const db = getDb();
    const q = query(collection(db, PERSONNEL), orderBy("created_at", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  },
  async createPersonnel(p: Omit<Personnel, "id" | "created_at" | "updated_at">): Promise<Personnel> {
    const db = getDb();
    // Remove undefined values for Firestore compatibility
    const cleanData = Object.fromEntries(
      Object.entries({ ...p, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .filter(([_, value]) => value !== undefined)
    );
    const ref = await addDoc(collection(db, PERSONNEL), cleanData);
    return { id: ref.id, ...(p as any), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  },
  async updatePersonnel(id: string, p: Partial<Omit<Personnel, "id" | "created_at">>): Promise<Personnel> {
    const db = getDb();
    // Remove undefined values for Firestore compatibility
    const cleanData = Object.fromEntries(
      Object.entries({ ...p, updated_at: new Date().toISOString() })
        .filter(([_, value]) => value !== undefined)
    );
    await updateDoc(doc(db, PERSONNEL, id), cleanData);
    return { id, ...(p as any), updated_at: new Date().toISOString() } as any;
  },
  async deletePersonnel(id: string) {
    const db = getDb();
    await deleteDoc(doc(db, PERSONNEL, id));
    return { success: true };
  },

  async getCases(): Promise<Case[]> {
    const db = getDb();
    const q = query(collection(db, CASES), orderBy("created_at", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  },
  async createCase(c: Omit<Case, "id" | "created_at" | "updated_at">): Promise<Case> {
    const db = getDb();
    const cleanData = Object.fromEntries(
      Object.entries({ ...c, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .filter(([_, value]) => value !== undefined)
    );
    const ref = await addDoc(collection(db, CASES), cleanData);
    return { id: ref.id, ...(c as any), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any;
  },
  async deleteCase(id: string) {
    const db = getDb();
    await deleteDoc(doc(db, CASES, id));
    return { success: true };
  },

  async getDuties(): Promise<Duty[]> {
    const db = getDb();
    const q = query(collection(db, DUTIES), orderBy("created_at", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  },
  async createDuty(d: Omit<Duty, "id" | "created_at" | "updated_at">): Promise<Duty> {
    const db = getDb();
    const cleanData = Object.fromEntries(
      Object.entries({ ...d, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .filter(([_, value]) => value !== undefined)
    );
    const ref = await addDoc(collection(db, DUTIES), cleanData);
    return { id: ref.id, ...(d as any), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any;
  },
  async updateDuty(id: string, d: Partial<Omit<Duty, "id" | "created_at">>): Promise<Duty> {
    const db = getDb();
    const cleanData = Object.fromEntries(
      Object.entries({ ...d, updated_at: new Date().toISOString() })
        .filter(([_, value]) => value !== undefined)
    );
    await updateDoc(doc(db, DUTIES, id), cleanData);
    return { id, ...(d as any), updated_at: new Date().toISOString() } as any;
  },
  async deleteDuty(id: string) {
    const db = getDb();
    await deleteDoc(doc(db, DUTIES, id));
    return { success: true };
  },
};


// Firebase has been removed. This project now uses Neon (PostgreSQL) + Prisma.
// All data operations are handled by @/integrations/database (Prisma-backed).
export const firestoreHelpers = {
  getPersonnel: (): never => { throw new Error("Firebase removed. Use db from @/integrations/database."); },
  createPersonnel: (): never => { throw new Error("Firebase removed. Use db from @/integrations/database."); },
  updatePersonnel: (): never => { throw new Error("Firebase removed. Use db from @/integrations/database."); },
  deletePersonnel: (): never => { throw new Error("Firebase removed. Use db from @/integrations/database."); },
  getCases: (): never => { throw new Error("Firebase removed. Use db from @/integrations/database."); },
  createCase: (): never => { throw new Error("Firebase removed. Use db from @/integrations/database."); },
  deleteCase: (): never => { throw new Error("Firebase removed. Use db from @/integrations/database."); },
  getDuties: (): never => { throw new Error("Firebase removed. Use db from @/integrations/database."); },
  createDuty: (): never => { throw new Error("Firebase removed. Use db from @/integrations/database."); },
  updateDuty: (): never => { throw new Error("Firebase removed. Use db from @/integrations/database."); },
  deleteDuty: (): never => { throw new Error("Firebase removed. Use db from @/integrations/database."); },
};

// Firebase has been removed. This project now uses Neon (PostgreSQL) + Prisma.
// Import from @/lib/prisma instead.
export function getFirebaseApp(): never {
  throw new Error("Firebase has been removed. Use Prisma (@/lib/prisma) instead.");
}

export function getDb(): never {
  throw new Error("Firebase has been removed. Use Prisma (@/lib/prisma) instead.");
}


import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("pass", 12);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      fullName: "System Administrator",
      password: passwordHash,
      role: "admin",
      isActive: true,
    },
    create: {
      userId: "USR-0001",
      fullName: "System Administrator",
      username: "admin",
      password: passwordHash,
      role: "admin",
      isActive: true,
    },
  });

  console.log(`Admin user ready: ${admin.username} (userId: ${admin.userId})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

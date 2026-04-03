import { NextRequest, NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import { signSessionToken } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/cookies";
import { prisma } from "@/lib/prisma";

// Accepts identifier (email or badge_number) in the "email" field for backward compatibility
export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email/Username and password are required" }, { status: 400 });
  }

  try {
    const identifier = email.trim();

    // 1. Check User table first (admin/system accounts with username/password)
    const adminUser = await prisma.user.findUnique({
      where: { username: identifier },
    });

    if (adminUser) {
      if (!adminUser.isActive) {
        return NextResponse.json({ error: "Account is not active" }, { status: 401 });
      }

      const valid = await verifyPassword(password, adminUser.password);
      if (!valid) {
        return NextResponse.json({ error: "Incorrect username or password" }, { status: 401 });
      }

      await prisma.user.update({
        where: { id: adminUser.id },
        data: { lastLoginAt: new Date() },
      });

      const token = signSessionToken({
        sub: adminUser.id,
        email: adminUser.username,
        role: adminUser.role,
      });
      await setSessionCookie(token, 60 * 60 * 8);
      return NextResponse.json({
        id: adminUser.id,
        userId: adminUser.userId,
        fullName: adminUser.fullName,
        email: adminUser.username,
        role: adminUser.role,
      });
    }

    // 2. Fall back to Personnel table (email or badge number)
    const profile = await prisma.personnel.findFirst({
      where: {
        OR: [
          { email: { equals: identifier, mode: "insensitive" } },
          { badge_number: { equals: identifier, mode: "insensitive" } },
        ],
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Incorrect username or password" }, { status: 401 });
    }

    if (profile.status !== "active") {
      return NextResponse.json({ error: "Account is not active" }, { status: 401 });
    }

    if (profile.password_hash) {
      const valid = await verifyPassword(password, profile.password_hash);
      if (!valid) {
        return NextResponse.json({ error: "Incorrect username or password" }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: "Password not configured. Contact your administrator." }, { status: 401 });
    }

    const token = signSessionToken({
      sub: profile.id,
      email: profile.email,
      role: profile.rank || "officer",
    });
    await setSessionCookie(token, 60 * 60 * 8);

    return NextResponse.json({
      id: profile.id,
      email: profile.email,
      role: profile.rank || "officer",
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}


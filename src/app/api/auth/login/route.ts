import { NextRequest, NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import { signSessionToken } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/cookies";
import { db } from "@/integrations/database";

// Accepts identifier (email or username) in the "email" field for backward compatibility
export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email/Username and password are required" }, { status: 400 });
  }

  try {
    // Get all personnel from Firebase and find matching profile
    const personnel = await db.getPersonnel();
    let profile = personnel.find(p => p.email === email);
    
    // If not found by email, try by badge number as username
    if (!profile) {
      profile = personnel.find(p => p.badge_number === email);
    }

    if (!profile) {
      return NextResponse.json({ error: "Incorrect Username or password" }, { status: 401 });
    }

    // For demo purposes, accept any password for active personnel
    // In production, you would verify against stored encrypted password
    if (profile.status !== "active") {
      return NextResponse.json({ error: "Account is not active" }, { status: 401 });
    }

    const token = signSessionToken({ 
      sub: profile.id, 
      email: profile.email, 
      role: profile.rank || "officer" 
    });
    await setSessionCookie(token, 60 * 60 * 8);

    return NextResponse.json({ 
      id: profile.id, 
      email: profile.email, 
      role: profile.rank || "officer" 
    });
  } catch (error) {
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}


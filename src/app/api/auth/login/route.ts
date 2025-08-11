import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/integrations/supabase/server";
import { verifyPassword } from "@/lib/auth/password";
import { signSessionToken } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/cookies";

// Accepts identifier (email or username) in the "email" field for backward compatibility
export async function POST(req: NextRequest) {
  const supabase = getServerSupabase();
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email/Username and password are required" }, { status: 400 });
  }

  // Try by email first
  let { data: profile, error } = await supabase
    .from("profiles")
    .select("id, email, username, encrypted_password, role")
    .eq("email", email)
    .single();

  if (error || !profile) {
    // Try by username
    const byUsername = await supabase
      .from("profiles")
      .select("id, email, username, encrypted_password, role")
      .eq("username", email)
      .single();
    profile = byUsername.data as any;
  }

  if (!profile) {
    return NextResponse.json({ error: "Incorrect Username or password" }, { status: 401 });
  }

  const ok = await verifyPassword(password, profile.encrypted_password);
  if (!ok) {
    return NextResponse.json({ error: "Incorrect Username or password" }, { status: 401 });
  }

  const token = signSessionToken({ sub: profile.id, email: profile.email, role: profile.role || "user" });
  await setSessionCookie(token, 60 * 60 * 8);

  return NextResponse.json({ id: profile.id, email: profile.email, role: profile.role || "user" });
}


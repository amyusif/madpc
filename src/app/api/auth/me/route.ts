import { NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth/currentUser";

export async function GET() {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ user: null }, { status: 200 });
  return NextResponse.json({ user });
}


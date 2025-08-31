import { NextRequest, NextResponse } from "next/server";
import { db } from "@/integrations/database";

export async function POST(req: NextRequest) {
  const { identifier } = await req.json();
  if (!identifier || typeof identifier !== "string") {
    return NextResponse.json({ error: "identifier is required" }, { status: 400 });
  }

  const input = identifier.trim();
  if (input.includes("@")) {
    // Treat as email directly
    return NextResponse.json({ email: input });
  }

  try {
    // Get personnel from Firebase and find by badge number (username)
    const personnel = await db.getPersonnel();
    const profile = personnel.find(p => 
      p.badge_number.toLowerCase() === input.toLowerCase()
    );

    if (!profile?.email) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    return NextResponse.json({ email: profile.email });
  } catch (error) {
    return NextResponse.json({ error: "Failed to resolve identifier" }, { status: 500 });
  }
}


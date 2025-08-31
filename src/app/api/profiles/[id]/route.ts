import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth/currentUser";
import { db } from "@/integrations/database";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await getCurrentUserFromCookie();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get personnel data from Firebase
    const personnel = await db.getPersonnel();
    const profile = personnel.find(p => p.id === resolvedParams.id);
    
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      profile: {
        id: profile.id,
        full_name: `${profile.first_name} ${profile.last_name}`,
        badge_number: profile.badge_number,
        role: profile.rank,
        phone: profile.phone,
        avatar_url: profile.photo_url,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      }
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth/currentUser";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await getCurrentUserFromCookie();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profile = await prisma.personnel.findUnique({
      where: { id: resolvedParams.id },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        badge_number: true,
        rank: true,
        phone: true,
        photo_url: true,
        created_at: true,
        updated_at: true,
      },
    });

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
        created_at: profile.created_at instanceof Date ? profile.created_at.toISOString() : profile.created_at,
        updated_at: profile.updated_at instanceof Date ? profile.updated_at.toISOString() : profile.updated_at,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await getCurrentUserFromCookie();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const updates = await req.json();
    const allowedFields = ["phone", "photo_url", "first_name", "last_name"];
    const data: Record<string, any> = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) data[field] = updates[field];
    }

    const profile = await prisma.personnel.update({
      where: { id: resolvedParams.id },
      data,
    });

    return NextResponse.json({
      profile: {
        id: profile.id,
        full_name: `${profile.first_name} ${profile.last_name}`,
        badge_number: profile.badge_number,
        role: profile.rank,
        phone: profile.phone,
        avatar_url: profile.photo_url,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { identifier } = await req.json();
  if (!identifier || typeof identifier !== "string") {
    return NextResponse.json({ error: "identifier is required" }, { status: 400 });
  }

  const input = identifier.trim();
  if (input.includes("@")) {
    return NextResponse.json({ email: input });
  }

  try {
    const profile = await prisma.personnel.findFirst({
      where: { badge_number: { equals: input, mode: "insensitive" } },
      select: { email: true },
    });

    if (!profile?.email) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    return NextResponse.json({ email: profile.email });
  } catch (error) {
    return NextResponse.json({ error: "Failed to resolve identifier" }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const serialize = (row: any) => ({
  ...row,
  created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
});

export async function GET() {
  try {
    const rows = await prisma.personnel.findMany({ orderBy: { created_at: "desc" } });
    return NextResponse.json({ data: rows.map(serialize) });
  } catch (error) {
    console.error("GET /api/personnel error:", error);
    return NextResponse.json({ error: "Failed to fetch personnel" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const row = await prisma.personnel.create({
      data: {
        badge_number: body.badge_number,
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email,
        phone: body.phone ?? null,
        rank: body.rank,
        unit: body.unit,
        date_joined: body.date_joined,
        emergency_contacts: body.emergency_contacts ?? [],
        marital_status: body.marital_status,
        spouse: body.spouse ?? null,
        children_count: body.children_count ?? null,
        no_children: body.no_children ?? false,
        status: body.status,
        photo_url: body.photo_url ?? null,
        password_hash: body.password_hash ?? null,
      },
    });
    return NextResponse.json({ data: serialize(row) });
  } catch (error) {
    console.error("POST /api/personnel error:", error);
    return NextResponse.json({ error: "Failed to create personnel" }, { status: 500 });
  }
}

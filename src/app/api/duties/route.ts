import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const serialize = (row: any) => ({
  ...row,
  created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
});

export async function GET() {
  try {
    const rows = await prisma.duty.findMany({ orderBy: { created_at: "desc" } });
    return NextResponse.json({ data: rows.map(serialize) });
  } catch (error) {
    console.error("GET /api/duties error:", error);
    return NextResponse.json({ error: "Failed to fetch duties" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const row = await prisma.duty.create({
      data: {
        personnel_id: body.personnel_id,
        duty_type: body.duty_type,
        description: body.description,
        location: body.location,
        start_time: body.start_time,
        end_time: body.end_time ?? null,
        status: body.status,
        notes: body.notes ?? null,
      },
    });
    return NextResponse.json({ data: serialize(row) });
  } catch (error) {
    console.error("POST /api/duties error:", error);
    return NextResponse.json({ error: "Failed to create duty" }, { status: 500 });
  }
}

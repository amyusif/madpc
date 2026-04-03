import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const serialize = (row: any) => ({
  ...row,
  created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
});

export async function GET() {
  try {
    const rows = await prisma.case.findMany({ orderBy: { created_at: "desc" } });
    return NextResponse.json({ data: rows.map(serialize) });
  } catch (error) {
    console.error("GET /api/cases error:", error);
    return NextResponse.json({ error: "Failed to fetch cases" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const row = await prisma.case.create({
      data: {
        case_number: body.case_number,
        case_title: body.case_title,
        case_type: body.case_type,
        description: body.description,
        priority: body.priority,
        status: body.status,
        assigned_to: body.assigned_to ?? null,
        reported_by: body.reported_by,
      },
    });
    return NextResponse.json({ data: serialize(row) });
  } catch (error) {
    console.error("POST /api/cases error:", error);
    return NextResponse.json({ error: "Failed to create case" }, { status: 500 });
  }
}

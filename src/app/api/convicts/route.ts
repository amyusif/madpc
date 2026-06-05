import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const serialize = (row: any) => ({
  ...row,
  created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
});

export async function GET() {
  try {
    const rows = await prisma.convict.findMany({ orderBy: { created_at: "desc" } });
    return NextResponse.json({ data: rows.map(serialize) });
  } catch (error) {
    console.error("GET /api/convicts error:", error);
    return NextResponse.json({ error: "Failed to fetch convicts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const row = await prisma.convict.create({
      data: {
        full_name: body.full_name,
        alias: body.alias ?? null,
        gender: body.gender ?? null,
        date_of_birth: body.date_of_birth ?? null,
        nationality: body.nationality ?? null,
        photo_url: body.photo_url ?? null,
        case_id: body.case_id ?? null,
        case_number: body.case_number ?? null,
        crime_type: body.crime_type,
        sentence: body.sentence,
        sentence_start_date: body.sentence_start_date ?? null,
        sentence_end_date: body.sentence_end_date ?? null,
        date_in: body.date_in ?? null,
        date_out: body.date_out ?? null,
        status: body.status ?? "imprisoned",
        court_ruling: body.court_ruling ?? null,
        court_date: body.court_date ?? null,
        presiding_judge: body.presiding_judge ?? null,
        notes: body.notes ?? null,
      },
    });
    return NextResponse.json({ data: serialize(row) });
  } catch (error) {
    console.error("POST /api/convicts error:", error);
    return NextResponse.json({ error: "Failed to create convict" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const serialize = (row: any) => ({
  ...row,
  created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const case_id = searchParams.get("case_id");
    const rows = await prisma.caseReport.findMany({
      where: case_id ? { case_id } : undefined,
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json({ data: rows.map(serialize) });
  } catch (error) {
    console.error("GET /api/case-reports error:", error);
    return NextResponse.json({ error: "Failed to fetch case reports" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const row = await prisma.caseReport.create({
      data: {
        case_id: body.case_id,
        report_text: body.report_text,
        court_ruling: body.court_ruling ?? null,
        court_date: body.court_date ?? null,
        presiding_judge: body.presiding_judge ?? null,
        evidence_urls: body.evidence_urls ?? [],
        created_by: body.created_by ?? null,
      },
    });
    return NextResponse.json({ data: serialize(row) });
  } catch (error) {
    console.error("POST /api/case-reports error:", error);
    return NextResponse.json({ error: "Failed to create case report" }, { status: 500 });
  }
}

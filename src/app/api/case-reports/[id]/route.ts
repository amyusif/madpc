import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const serialize = (row: any) => ({
  ...row,
  created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const row = await prisma.caseReport.update({
      where: { id: params.id },
      data: {
        ...(body.report_text !== undefined && { report_text: body.report_text }),
        ...(body.court_ruling !== undefined && { court_ruling: body.court_ruling }),
        ...(body.court_date !== undefined && { court_date: body.court_date }),
        ...(body.presiding_judge !== undefined && { presiding_judge: body.presiding_judge }),
        ...(body.evidence_urls !== undefined && { evidence_urls: body.evidence_urls }),
        ...(body.created_by !== undefined && { created_by: body.created_by }),
      },
    });
    return NextResponse.json({ data: serialize(row) });
  } catch (error) {
    console.error("PATCH /api/case-reports/[id] error:", error);
    return NextResponse.json({ error: "Failed to update case report" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.caseReport.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/case-reports/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete case report" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const serialize = (row: any) => ({
  ...row,
  created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const row = await prisma.convict.findUnique({ where: { id } });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: serialize(row) });
  } catch (error) {
    console.error("GET /api/convicts/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch convict" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const row = await prisma.convict.update({
      where: { id },
      data: {
        ...(body.full_name !== undefined && { full_name: body.full_name }),
        ...(body.alias !== undefined && { alias: body.alias }),
        ...(body.gender !== undefined && { gender: body.gender }),
        ...(body.date_of_birth !== undefined && { date_of_birth: body.date_of_birth }),
        ...(body.nationality !== undefined && { nationality: body.nationality }),
        ...(body.photo_url !== undefined && { photo_url: body.photo_url }),
        ...(body.case_id !== undefined && { case_id: body.case_id }),
        ...(body.case_number !== undefined && { case_number: body.case_number }),
        ...(body.crime_type !== undefined && { crime_type: body.crime_type }),
        ...(body.sentence !== undefined && { sentence: body.sentence }),
        ...(body.sentence_start_date !== undefined && { sentence_start_date: body.sentence_start_date }),
        ...(body.sentence_end_date !== undefined && { sentence_end_date: body.sentence_end_date }),
        ...(body.date_in !== undefined && { date_in: body.date_in }),
        ...(body.date_out !== undefined && { date_out: body.date_out }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.court_ruling !== undefined && { court_ruling: body.court_ruling }),
        ...(body.court_date !== undefined && { court_date: body.court_date }),
        ...(body.presiding_judge !== undefined && { presiding_judge: body.presiding_judge }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    });
    return NextResponse.json({ data: serialize(row) });
  } catch (error) {
    console.error("PATCH /api/convicts/[id] error:", error);
    return NextResponse.json({ error: "Failed to update convict" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.convict.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/convicts/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete convict" }, { status: 500 });
  }
}

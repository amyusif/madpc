import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const serialize = (row: any) => ({
  ...row,
  created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const row = await prisma.duty.update({
      where: { id },
      data: {
        ...(body.personnel_id !== undefined && { personnel_id: body.personnel_id }),
        ...(body.duty_type !== undefined && { duty_type: body.duty_type }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.location !== undefined && { location: body.location }),
        ...(body.start_time !== undefined && { start_time: body.start_time }),
        ...(body.end_time !== undefined && { end_time: body.end_time }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    });

    return NextResponse.json({ data: serialize(row) });
  } catch (error) {
    console.error("PATCH /api/duties/[id] error:", error);
    return NextResponse.json({ error: "Failed to update duty" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.duty.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/duties/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete duty" }, { status: 500 });
  }
}

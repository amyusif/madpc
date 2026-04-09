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

    const row = await prisma.personnel.update({
      where: { id },
      data: {
        ...(body.badge_number !== undefined && { badge_number: body.badge_number }),
        ...(body.service_number !== undefined && { service_number: body.service_number }),
        ...(body.pin_number !== undefined && { pin_number: body.pin_number }),
        ...(body.police_office_number !== undefined && { police_office_number: body.police_office_number }),
        ...(body.first_name !== undefined && { first_name: body.first_name }),
        ...(body.last_name !== undefined && { last_name: body.last_name }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.rank !== undefined && { rank: body.rank }),
        ...(body.unit !== undefined && { unit: body.unit }),
        ...(body.date_joined !== undefined && { date_joined: body.date_joined }),
        ...(body.emergency_contacts !== undefined && { emergency_contacts: body.emergency_contacts }),
        ...(body.marital_status !== undefined && { marital_status: body.marital_status }),
        ...(body.spouse !== undefined && { spouse: body.spouse }),
        ...(body.children_count !== undefined && { children_count: body.children_count }),
        ...(body.no_children !== undefined && { no_children: body.no_children }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.photo_url !== undefined && { photo_url: body.photo_url }),
        ...(body.password_hash !== undefined && { password_hash: body.password_hash }),
      },
    });

    return NextResponse.json({ data: serialize(row) });
  } catch (error) {
    console.error("PATCH /api/personnel/[id] error:", error);
    return NextResponse.json({ error: "Failed to update personnel" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.personnel.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/personnel/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete personnel" }, { status: 500 });
  }
}

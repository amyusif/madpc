import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookie } from "@/lib/auth/currentUser";

const ALLOWED_REVIEW_STATUSES = new Set(["approved", "rejected"]);

function hasManagementPrivileges(role?: string | null) {
  if (!role) return false;
  const normalized = role.toLowerCase();
  return (
    normalized === "admin" ||
    normalized === "manager" ||
    normalized === "supervisor" ||
    normalized === "district_commander" ||
    normalized === "unit_supervisor" ||
    normalized.includes("commander") ||
    normalized.includes("supervisor")
  );
}

function toIso(value: unknown) {
  return value instanceof Date ? value.toISOString() : value;
}

function serializeLeave(row: any) {
  return {
    ...row,
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
    reviewed_at: toIso(row.reviewed_at),
  };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUserFromCookie();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const nextStatus = String(body.status ?? "").toLowerCase();
    const adminNote = body.admin_note == null ? null : String(body.admin_note).trim();

    if (!ALLOWED_REVIEW_STATUSES.has(nextStatus)) {
      return NextResponse.json(
        { error: "Status must be either approved or rejected" },
        { status: 400 }
      );
    }

    const [adminAccount, personnelAccount, existingLeave] = await Promise.all([
      prisma.user.findUnique({ where: { id: currentUser.id } }),
      prisma.personnel.findUnique({ where: { id: currentUser.id } }),
      prisma.leaveRequest.findUnique({ where: { id } }),
    ]);

    const role = adminAccount?.role ?? currentUser.role ?? personnelAccount?.rank ?? null;
    if (!hasManagementPrivileges(role)) {
      return NextResponse.json({ error: "Only management can review leave requests" }, { status: 403 });
    }

    if (!existingLeave) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }

    if (existingLeave.status !== "pending") {
      return NextResponse.json(
        { error: `This request has already been ${existingLeave.status}` },
        { status: 409 }
      );
    }

    const row = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: nextStatus as any,
        admin_note: adminNote,
        reviewed_by_user_id: adminAccount?.id ?? null,
        reviewed_at: new Date(),
      },
      include: {
        personnel: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            badge_number: true,
            unit: true,
            rank: true,
          },
        },
        reviewed_by: {
          select: {
            id: true,
            fullName: true,
            username: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ data: serializeLeave(row) });
  } catch (error) {
    console.error("PATCH /api/leave/[id] error:", error);
    return NextResponse.json({ error: "Failed to review leave request" }, { status: 500 });
  }
}

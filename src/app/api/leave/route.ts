import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookie } from "@/lib/auth/currentUser";

const LEAVE_TYPES = new Set([
  "annual",
  "sick",
  "casual",
  "compassionate",
  "maternity",
  "paternity",
  "study",
  "unpaid",
]);

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

function calculateDaysRequested(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid leave dates");
  }
  if (end < start) {
    throw new Error("End date cannot be before start date");
  }
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1;
}

export async function GET() {
  const currentUser = await getCurrentUserFromCookie();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [adminAccount, personnelAccount] = await Promise.all([
      prisma.user.findUnique({ where: { id: currentUser.id } }),
      prisma.personnel.findUnique({ where: { id: currentUser.id } }),
    ]);

    const role = adminAccount?.role ?? currentUser.role ?? personnelAccount?.rank ?? null;
    const canApprove = hasManagementPrivileges(role);

    if (canApprove) {
      const rows = await prisma.leaveRequest.findMany({
        orderBy: { created_at: "desc" },
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
      return NextResponse.json({
        mode: "management",
        data: rows.map(serializeLeave),
      });
    }

    if (!personnelAccount) {
      return NextResponse.json({
        mode: "none",
        data: [],
      });
    }

    const rows = await prisma.leaveRequest.findMany({
      where: { personnel_id: currentUser.id },
      orderBy: { created_at: "desc" },
      include: {
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

    return NextResponse.json({
      mode: "officer",
      data: rows.map(serializeLeave),
    });
  } catch (error) {
    console.error("GET /api/leave error:", error);
    return NextResponse.json({ error: "Failed to fetch leave requests" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
    const currentUser = await getCurrentUserFromCookie();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const personnelAccount = await prisma.personnel.findUnique({ where: { id: currentUser.id } });
    if (!personnelAccount) {
      return NextResponse.json(
        { error: "Only personnel officers can request leave" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const leaveType = String(body.leave_type ?? "").toLowerCase();
    const startDate = String(body.start_date ?? "");
    const endDate = String(body.end_date ?? "");
    const reason = String(body.reason ?? "").trim();

    if (!LEAVE_TYPES.has(leaveType)) {
      return NextResponse.json({ error: "Invalid leave type" }, { status: 400 });
    }
    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Start date and end date are required" }, { status: 400 });
    }
    if (!reason) {
      return NextResponse.json({ error: "Leave reason is required" }, { status: 400 });
    }

    const daysRequested = calculateDaysRequested(startDate, endDate);

    const row = await prisma.leaveRequest.create({
      data: {
        personnel_id: currentUser.id,
        leave_type: leaveType as any,
        start_date: startDate,
        end_date: endDate,
        days_requested: daysRequested,
        reason,
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
      },
    });

    return NextResponse.json({ data: serializeLeave(row) });
  } catch (error: any) {
    console.error("POST /api/leave error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to submit leave request" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const messages = await prisma.message.findMany({
      orderBy: { created_at: "desc" },
      include: { recipients: true },
    });
    return NextResponse.json({ messages });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { subject, body, personnelIds } = await req.json();
    if (!subject || !body || !Array.isArray(personnelIds) || personnelIds.length === 0) {
      return NextResponse.json({ error: "subject, body, personnelIds required" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        subject,
        body,
        recipients: {
          create: (personnelIds as string[]).map((id) => ({
            personnel_id: id,
            email: "",
            status: "pending",
          })),
        },
      },
      include: { recipients: true },
    });

    return NextResponse.json({ message, recipients: message.recipients });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to create message" }, { status: 500 });
  }
}

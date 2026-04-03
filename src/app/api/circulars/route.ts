import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const circulars = await prisma.circular.findMany({
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json({ circulars });
  } catch (error: any) {
    console.error("Error fetching circulars:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, message, unit, recipients, channels } = await request.json();

    if (!title || !message || !recipients || recipients.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const effectiveChannels = channels || ["email", "sms"];

    const circular = await prisma.circular.create({
      data: {
        title,
        message,
        unit: unit ?? null,
        channels: effectiveChannels,
        recipient_count: recipients.length,
        status: "sent",
        recipients: {
          create: (recipients as string[]).map((personnelId) => ({
            personnel_id: personnelId,
            email_status: "pending",
            sms_status: "pending",
          })),
        },
      },
    });

    // Send notifications (email + SMS)
    try {
      const notificationRes = await fetch(`${request.nextUrl.origin}/api/notifications/personnel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personnelIds: recipients,
          subject: `📢 Circular: ${title}`,
          message: `${message}\n\n---\nThis is an official circular from MADPC.`,
          channels: effectiveChannels,
          type: "circular",
        }),
      });
      if (!notificationRes.ok) {
        console.error("Failed to send notifications");
      }
    } catch (notificationError) {
      console.error("Notification error:", notificationError);
    }

    return NextResponse.json({ circular });
  } catch (error: any) {
    console.error("Error creating circular:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/email-service";

async function getPersonnelData(personnelIds: string[]) {
  const rows = await prisma.personnel.findMany({
    where: { id: { in: personnelIds } },
  });
  return rows;
}

async function logMessage(subject: string, message: string, recipients: { id: string; email?: string; phone?: string }[]) {
  const msg = await prisma.message.create({
    data: {
      subject,
      body: message,
      recipients: {
        create: recipients.map((r) => ({
          personnel_id: r.id,
          email: r.email ?? "",
          phone: r.phone ?? "",
          status: "pending",
        })),
      },
    },
  });
  return msg.id;
}

async function updateRecipientStatus(
  messageId: string | null,
  personnelId: string,
  channel: string,
  status: string,
  error?: string
) {
  if (!messageId) return;
  try {
    await prisma.messageRecipient.updateMany({
      where: { message_id: messageId, personnel_id: personnelId },
      data: {
        [`${channel}_status`]: status,
        [`${channel}_error`]: error ?? "",
      },
    });
  } catch (e) {
    console.warn("Failed to update recipient status:", e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      personnelIds,
      subject,
      message,
      channels = ["email"],
      scheduleAt,
    } = await req.json();

    if (!Array.isArray(personnelIds) || personnelIds.length === 0) {
      return NextResponse.json({ error: "personnelIds is required" }, { status: 400 });
    }
    if (!subject || !message) {
      return NextResponse.json({ error: "subject and message are required" }, { status: 400 });
    }

    // Fetch personnel data
    const data = await getPersonnelData(personnelIds);
    type Recipient = { id: string; email?: string; phone?: string; name?: string };

    const recipients: Recipient[] = data
      .map((p: any) => ({
        id: String(p.id),
        email: (p.email || "").trim(),
        phone: (p.phone || "").trim(),
        name: `${p.first_name || ""} ${p.last_name || ""}`.trim(),
      }))
      .filter(
        (r) =>
          (channels.includes("email") && r.email) ||
          (channels.includes("sms") && r.phone)
      );

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No valid recipients found" },
        { status: 400 }
      );
    }

    // Log message and recipients
    const messageId = await logMessage(subject, message, recipients);

    let emailResults: boolean[] = [];
    let smsResults: boolean[] = [];

    // Send emails if requested
    if (channels.includes("email")) {
      const from = (
        process.env.SMTP_FROM ||
        process.env.SMTP_USER ||
        ""
      ).trim();
      const html = (
        await import("@/lib/email/templates/notification")
      ).buildNotificationHtml({ subject, message });

      emailResults = await Promise.all(
        recipients
          .filter((r) => r.email)
          .map(async (r: Recipient) => {
            try {
              const res = await sendEmail({
                from,
                to: r.email!,
                subject,
                text: message,
                html,
              });
              if (!res.success)
                throw new Error(res.error || "Email send failed");
              await updateRecipientStatus(messageId, r.id, "email", "sent");
              return true;
            } catch (err: any) {
              await updateRecipientStatus(
                messageId,
                r.id,
                "email",
                "failed",
                err?.message
              );
              return false;
            }
          })
      );
    }

    // Send SMS if requested
    if (channels.includes("sms")) {
      smsResults = await Promise.all(
        recipients
          .filter((r) => r.phone)
          .map(async (r: Recipient) => {
            try {
              await sendSMS(
                r.phone!,
                `${subject}\n\n${message}`.trim(),
                scheduleAt
              );
              await updateRecipientStatus(messageId, r.id, "sms", "sent");
              return true;
            } catch (err: any) {
              console.error(
                "[SMS] Send failed for",
                r.phone,
                err?.message || err
              );
              await updateRecipientStatus(
                messageId,
                r.id,
                "sms",
                "failed",
                err?.message
              );
              return false;
            }
          })
      );
    }

    const emailSent = emailResults.filter(Boolean).length;
    const emailFailed = emailResults.length - emailSent;
    const smsSent = smsResults.filter(Boolean).length;
    const smsFailed = smsResults.length - smsSent;

    return NextResponse.json({
      ok: true,
      messageId,
      email: { sent: emailSent, failed: emailFailed },
      sms: { sent: smsSent, failed: smsFailed },
      total: { sent: emailSent + smsSent, failed: emailFailed + smsFailed },
    });
  } catch (e: any) {
    console.error("Notification error:", e?.message || e);
    return NextResponse.json(
      { error: e?.message || "Internal error" },
      { status: 500 }
    );
  }
}

async function sendSMS(
  phone: string,
  message: string,
  scheduleAt?: string
): Promise<void> {
  // Use UelloSend helper functions for all SMS sends
  const { sendSingleSMS, sendBulkSMS, formatPhoneNumber, validatePhoneNumber } =
    await import("@/utils/smsService");

  // Format phone number first
  const formatted = formatPhoneNumber(phone);

  // Validate the formatted number
  if (!validatePhoneNumber(formatted)) {
    throw new Error(`Invalid phone number: ${phone} (formatted: ${formatted})`);
  }

  // If scheduleAt is provided, use campaign (bulk) endpoint to schedule for this single recipient
  if (scheduleAt) {
    const res = await sendBulkSMS([formatted], message);
    if (!res.success) throw new Error(res.error || "Failed to schedule SMS");
    return;
  }

  const res = await sendSingleSMS(formatted, message);
  if (!res.success) throw new Error(res.error || "Failed to send SMS");
}

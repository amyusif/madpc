import { NextRequest, NextResponse } from "next/server";
import { getResend, EMAIL_FROM } from "@/lib/email/resend";

const useFirestore = () => (process.env.NEXT_PUBLIC_USE_FIRESTORE || "").toString() === "true";

async function getPersonnelData(personnelIds: string[]) {
  if (useFirestore()) {
    const { getDb } = await import("@/integrations/firebase/client");
    const { collection, query, where, getDocs } = await import("firebase/firestore");
    const db = getDb();
    const q = query(collection(db, "personnel"), where("__name__", "in", personnelIds));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  } else {
    const { getServerSupabase } = await import("@/integrations/supabase/server");
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("personnel")
      .select("id, email, first_name, last_name, phone")
      .in("id", personnelIds);
    if (error) throw new Error(error.message || "Failed to fetch personnel");
    return data || [];
  }
}

async function logMessage(subject: string, message: string, recipients: any[]) {
  if (useFirestore()) {
    const { getDb } = await import("@/integrations/firebase/client");
    const { collection, addDoc, doc, setDoc } = await import("firebase/firestore");
    const db = getDb();
    const msgRef = await addDoc(collection(db, "messages"), {
      subject,
      body: message,
      created_at: new Date().toISOString(),
    });
    const messageId = msgRef.id;
    // Log recipients
    for (const r of recipients) {
      await setDoc(doc(db, "message_recipients", `${messageId}_${r.id}`), {
        message_id: messageId,
        personnel_id: r.id,
        email: r.email,
        phone: r.phone || "",
        status: "pending",
        created_at: new Date().toISOString(),
      });
    }
    return messageId;
  }
  return null; // Skip logging if not using Firestore
}

export async function POST(req: NextRequest) {
  try {
    const { personnelIds, subject, message, channels = ["email"] } = await req.json();

    if (!Array.isArray(personnelIds) || personnelIds.length === 0) {
      return NextResponse.json({ error: "personnelIds is required" }, { status: 400 });
    }
    if (!subject || !message) {
      return NextResponse.json({ error: "subject and message are required" }, { status: 400 });
    }

    // Fetch personnel data
    const data = await getPersonnelData(personnelIds);
    const recipients = data
      .map((p: any) => ({
        id: p.id,
        email: (p.email || "").trim(),
        phone: (p.phone || "").trim(),
        name: `${p.first_name} ${p.last_name}`
      }))
      .filter((r) => (channels.includes("email") && r.email) || (channels.includes("sms") && r.phone));

    if (recipients.length === 0) {
      return NextResponse.json({ error: "No valid recipients found" }, { status: 400 });
    }

    // Log message and recipients
    const messageId = await logMessage(subject, message, recipients);

    let emailResults: boolean[] = [];
    let smsResults: boolean[] = [];

    // Send emails if requested
    if (channels.includes("email")) {
      const resend = getResend();
      const from = (EMAIL_FROM || "").trim();
      const html = (await import("@/lib/email/templates/notification")).buildNotificationHtml({ subject, message });

      emailResults = await Promise.all(
        recipients.filter(r => r.email).map(async (r) => {
          try {
            await resend.emails.send({ from, to: r.email, subject, text: message, html });
            await updateRecipientStatus(messageId, r.id, "email", "sent");
            return true;
          } catch (err: any) {
            await updateRecipientStatus(messageId, r.id, "email", "failed", err?.message);
            return false;
          }
        })
      );
    }

    // Send SMS if requested
    if (channels.includes("sms")) {
      smsResults = await Promise.all(
        recipients.filter(r => r.phone).map(async (r) => {
          try {
            await sendSMS(r.phone, `${subject}\n\n${message}`);
            await updateRecipientStatus(messageId, r.id, "sms", "sent");
            return true;
          } catch (err: any) {
            await updateRecipientStatus(messageId, r.id, "sms", "failed", err?.message);
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
      total: { sent: emailSent + smsSent, failed: emailFailed + smsFailed }
    });
  } catch (e: any) {
    console.error("Notification error:", e?.message || e);
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}

async function updateRecipientStatus(messageId: string | null, personnelId: string, channel: string, status: string, error?: string) {
  if (!messageId || !useFirestore()) return;
  try {
    const { getDb } = await import("@/integrations/firebase/client");
    const { doc, updateDoc } = await import("firebase/firestore");
    const db = getDb();
    await updateDoc(doc(db, "message_recipients", `${messageId}_${personnelId}`), {
      [`${channel}_status`]: status,
      [`${channel}_error`]: error || "",
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn("Failed to update recipient status:", e);
  }
}

async function sendSMS(phone: string, message: string): Promise<void> {
  // Placeholder for SMS implementation
  // You can integrate with Twilio, AWS SNS, or other SMS providers
  const smsProvider = process.env.SMS_PROVIDER || "none";

  if (smsProvider === "twilio") {
    const twilio = require("twilio");
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Format phone number properly for Ghana
    const { formatPhoneForSMS } = await import("@/utils/phoneUtils");
    const formattedPhone = formatPhoneForSMS(phone);

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });
  } else if (smsProvider === "aws") {
    // AWS SNS implementation would go here
    throw new Error("SMS not configured - set SMS_PROVIDER and credentials");
  } else {
    // For demo purposes, just log
    console.log(`📱 SMS would be sent to ${phone}: ${message}`);
    // Simulate success for demo
    return Promise.resolve();
  }
}


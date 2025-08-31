import { NextRequest, NextResponse } from "next/server";

const useFirestore = () => (process.env.NEXT_PUBLIC_USE_FIRESTORE || "").toString() === "true";

export async function GET() {
  try {
    if (useFirestore()) {
      const { getDb } = await import("@/integrations/firebase/client");
      const { collection, query, orderBy, getDocs } = await import("firebase/firestore");
      const db = getDb();
      const q = query(collection(db, "circulars"), orderBy("created_at", "desc"));
      const snap = await getDocs(q);
      const circulars = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      return NextResponse.json({ circulars });
    } else {
      // Fallback to Firebase if not using Firestore flag
      const { getDb } = await import("@/integrations/firebase/client");
      const { collection, query, orderBy, getDocs } = await import("firebase/firestore");
      const db = getDb();
      const q = query(collection(db, "circulars"), orderBy("created_at", "desc"));
      const snap = await getDocs(q);
      const circulars = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      return NextResponse.json({ circulars });
    }
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

    if (useFirestore()) {
      const { getDb } = await import("@/integrations/firebase/client");
      const { collection, addDoc, doc, setDoc } = await import("firebase/firestore");
      const db = getDb();

      // Create circular document
      const circularRef = await addDoc(collection(db, "circulars"), {
        title,
        message,
        unit,
        channels: channels || ["email", "sms"],
        recipient_count: recipients.length,
        status: "sent",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Create circular recipients
      const recipientPromises = recipients.map(async (personnelId: string) => {
        const recipientRef = doc(db, "circular_recipients", `${circularRef.id}_${personnelId}`);
        return setDoc(recipientRef, {
          circular_id: circularRef.id,
          personnel_id: personnelId,
          email_status: "pending",
          sms_status: "pending",
          created_at: new Date().toISOString(),
        });
      });

      await Promise.all(recipientPromises);

      // Send notifications (email + SMS)
      try {
        const notificationRes = await fetch(`${request.nextUrl.origin}/api/notifications/personnel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personnelIds: recipients,
            subject: `📢 Circular: ${title}`,
            message: `${message}\n\n---\nThis is an official circular from MADPC.`,
            channels: channels || ["email", "sms"],
            type: "circular"
          }),
        });

        if (!notificationRes.ok) {
          console.error("Failed to send notifications");
        }
      } catch (notificationError) {
        console.error("Notification error:", notificationError);
      }

      return NextResponse.json({
        circular: {
          id: circularRef.id,
          title,
          message,
          unit,
          channels: channels || ["email", "sms"],
          recipient_count: recipients.length,
          status: "sent",
          created_at: new Date().toISOString(),
        }
      });
    } else {
      // Fallback to Firebase if not using Firestore flag
      const { getDb } = await import("@/integrations/firebase/client");
      const { collection, addDoc, doc, setDoc } = await import("firebase/firestore");
      const db = getDb();

      // Create circular document
      const circularRef = await addDoc(collection(db, "circulars"), {
        title,
        message,
        unit,
        channels: channels || ["email", "sms"],
        recipient_count: recipients.length,
        status: "sent",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Create circular recipients
      const recipientPromises = recipients.map(async (personnelId: string) => {
        const recipientRef = doc(db, "circular_recipients", `${circularRef.id}_${personnelId}`);
        return setDoc(recipientRef, {
          circular_id: circularRef.id,
          personnel_id: personnelId,
          email_status: "pending",
          sms_status: "pending",
          created_at: new Date().toISOString(),
        });
      });

      await Promise.all(recipientPromises);

      // Send notifications (email + SMS)
      try {
        const notificationRes = await fetch(`${request.nextUrl.origin}/api/notifications/personnel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personnelIds: recipients,
            subject: `📢 Circular: ${title}`,
            message: `${message}\n\n---\nThis is an official circular from MADPC.`,
            channels: channels || ["email", "sms"],
            type: "circular"
          }),
        });

        if (!notificationRes.ok) {
          console.error("Failed to send notifications");
        }
      } catch (notificationError) {
        console.error("Notification error:", notificationError);
      }

      return NextResponse.json({
        circular: {
          id: circularRef.id,
          title,
          message,
          unit,
          channels: channels || ["email", "sms"],
          recipient_count: recipients.length,
          status: "sent",
          created_at: new Date().toISOString(),
        }
      });
    }
  } catch (error: any) {
    console.error("Error creating circular:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

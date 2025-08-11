import { NextRequest, NextResponse } from "next/server";

const useFirestore = () => (process.env.NEXT_PUBLIC_USE_FIRESTORE || "").toString() === "true";

export async function GET() {
  try {
    if (useFirestore()) {
      const { getDb } = await import("@/integrations/firebase/client");
      const { collection, query, orderBy, getDocs } = await import("firebase/firestore");
      const db = getDb();
      const q = query(collection(db, "messages"), orderBy("created_at", "desc"));
      const snap = await getDocs(q);
      const messages = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      return NextResponse.json({ messages });
    } else {
      const { getServerSupabase } = await import("@/integrations/supabase/server");
      const supabase = getServerSupabase();
      const { data, error } = await supabase
        .from("messages")
        .select("id, subject, body, created_by, created_at")
        .order("created_at", { ascending: false });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ messages: data });
    }
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

    if (useFirestore()) {
      const { getDb } = await import("@/integrations/firebase/client");
      const { collection, addDoc, doc, setDoc } = await import("firebase/firestore");
      const db = getDb();

      const msgRef = await addDoc(collection(db, "messages"), {
        subject,
        body,
        created_at: new Date().toISOString(),
      });

      const recipients = [];
      for (const id of personnelIds) {
        const recipientRef = doc(db, "message_recipients", `${msgRef.id}_${id}`);
        await setDoc(recipientRef, {
          message_id: msgRef.id,
          personnel_id: id,
          email: "",
          status: "pending",
          created_at: new Date().toISOString(),
        });
        recipients.push({ id: recipientRef.id, message_id: msgRef.id, personnel_id: id });
      }

      return NextResponse.json({
        message: { id: msgRef.id, subject, body, created_at: new Date().toISOString() },
        recipients
      });
    } else {
      const { getServerSupabase } = await import("@/integrations/supabase/server");
      const supabase = getServerSupabase();
      const { data: msg, error } = await supabase
        .from("messages")
        .insert([{ subject, body }])
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      const { data: recipients, error: rerr } = await supabase
        .from("message_recipients")
        .insert(
          personnelIds.map((id: string) => ({ message_id: msg.id, personnel_id: id, email: "" }))
        )
        .select();
      if (rerr) return NextResponse.json({ error: rerr.message }, { status: 500 });

      return NextResponse.json({ message: msg, recipients });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to create message" }, { status: 500 });
  }
}


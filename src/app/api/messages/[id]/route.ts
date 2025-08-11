import { NextRequest, NextResponse } from "next/server";

const useFirestore = () => (process.env.NEXT_PUBLIC_USE_FIRESTORE || "").toString() === "true";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (useFirestore()) {
      const { getDb } = await import("@/integrations/firebase/client");
      const { doc, getDoc, collection, query, where, getDocs } = await import("firebase/firestore");
      const db = getDb();

      // Get message
      const msgDoc = await getDoc(doc(db, "messages", params.id));
      if (!msgDoc.exists()) {
        return NextResponse.json({ error: "Message not found" }, { status: 404 });
      }

      // Get recipients
      const recipientsQuery = query(
        collection(db, "message_recipients"),
        where("message_id", "==", params.id)
      );
      const recipientsSnap = await getDocs(recipientsQuery);
      const recipients = recipientsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

      const message = { id: msgDoc.id, ...msgDoc.data(), recipients };
      return NextResponse.json({ message });
    } else {
      const { getServerSupabase } = await import("@/integrations/supabase/server");
      const supabase = getServerSupabase();
      const { data, error } = await supabase
        .from("messages")
        .select("*, recipients:message_recipients(*)")
        .eq("id", params.id)
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ message: data });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch message" }, { status: 500 });
  }
}


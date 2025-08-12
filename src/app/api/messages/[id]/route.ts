import { NextRequest, NextResponse } from "next/server";

const useFirestore = () => (process.env.NEXT_PUBLIC_USE_FIRESTORE || "").toString() === "true";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    if (useFirestore()) {
      const { getDb } = await import("@/integrations/firebase/client");
      const { doc, getDoc, collection, query, where, getDocs } = await import("firebase/firestore");
      const db = getDb();

      // Get message
      const msgDoc = await getDoc(doc(db, "messages", resolvedParams.id));
      if (!msgDoc.exists()) {
        return NextResponse.json({ error: "Message not found" }, { status: 404 });
      }

      // Get recipients
      const recipientsQuery = query(
        collection(db, "message_recipients"),
        where("message_id", "==", resolvedParams.id)
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
        .eq("id", resolvedParams.id)
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ message: data });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch message" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    if (useFirestore()) {
      const { getDb } = await import("@/integrations/firebase/client");
      const { doc, deleteDoc, collection, query, where, getDocs } = await import("firebase/firestore");
      const db = getDb();

      // Delete message recipients first
      const recipientsQuery = query(
        collection(db, "message_recipients"),
        where("message_id", "==", resolvedParams.id)
      );
      const recipientsSnap = await getDocs(recipientsQuery);
      const deletePromises = recipientsSnap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletePromises);

      // Delete the message
      await deleteDoc(doc(db, "messages", resolvedParams.id));

      return NextResponse.json({ success: true });
    } else {
      const { getServerSupabase } = await import("@/integrations/supabase/server");
      const supabase = getServerSupabase();

      // Delete message recipients first (cascade should handle this, but being explicit)
      await supabase.from("message_recipients").delete().eq("message_id", resolvedParams.id);

      // Delete the message
      const { error } = await supabase.from("messages").delete().eq("id", resolvedParams.id);
      if (error) throw new Error(error.message);

      return NextResponse.json({ success: true });
    }
  } catch (e: any) {
    console.error("Delete message error:", e);
    return NextResponse.json({ error: e?.message || "Failed to delete message" }, { status: 500 });
  }
}


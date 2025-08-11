import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/integrations/supabase/server";
import { getCurrentUserFromCookie } from "@/lib/auth/currentUser";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const current = getCurrentUserFromCookie();
  if (!current || current.id !== params.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, badge_number, role, phone, avatar_url, created_at, updated_at")
    .eq("id", params.id)
    .single();

  if (error) return NextResponse.json({ profile: null, error: error.message }, { status: 200 });
  return NextResponse.json({ profile: data });
}


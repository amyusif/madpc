import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/integrations/supabase/server";

export async function POST(req: NextRequest) {
  const { identifier } = await req.json();
  if (!identifier || typeof identifier !== "string") {
    return NextResponse.json({ error: "identifier is required" }, { status: 400 });
  }

  const input = identifier.trim();
  if (input.includes("@")) {
    // Treat as email directly
    return NextResponse.json({ email: input });
  }

  const supabase = getServerSupabase();
  // Case-insensitive match on username
  const { data, error } = await supabase
    .from("profiles")
    .select("email")
    .ilike("username", input)
    .single();

  if (error || !data?.email) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ email: data.email });
}


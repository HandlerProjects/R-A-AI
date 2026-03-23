import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await supabase.from("cartas").update({ notified: true }).eq("id", id);
  return NextResponse.json({ ok: true });
}

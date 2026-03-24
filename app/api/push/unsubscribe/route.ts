import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { endpoint, userName } = await req.json() as { endpoint?: string; userName?: string };

    if (endpoint) {
      await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
    } else if (userName) {
      await supabase.from("push_subscriptions").delete().eq("user_name", userName);
    } else {
      return NextResponse.json({ error: "Missing endpoint or userName" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

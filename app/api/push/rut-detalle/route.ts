import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { supabase } from "@/lib/supabase";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { preview } = await req.json() as { preview?: string };

    // Only send to Alejandro's subscriptions
    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_name", "alejandro");

    if (error || !subs?.length) {
      return NextResponse.json({ sent: 0 });
    }

    const body = preview
      ? `"${preview.slice(0, 60)}${preview.length > 60 ? "…" : ""}"`
      : "Ha anotado algo en su espacio 💗";

    const payload = JSON.stringify({
      title: "Rut ha escrito algo ✨",
      body,
      url: "/alejandro/rut",
      tag: "rut-detalle",
    });

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    return NextResponse.json({ sent });
  } catch (err) {
    console.error("rut-detalle push error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

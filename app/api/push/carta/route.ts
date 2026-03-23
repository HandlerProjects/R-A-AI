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
    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_name", "rut");

    if (error || !subs?.length) return NextResponse.json({ sent: 0 });

    const payload = JSON.stringify({
      title: "Alejandro te escribió una carta 💗",
      body: "¿A qué esperas para leerla?",
      url: "/rut/cartas",
      tag: "carta-nueva",
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
    console.error("carta push error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

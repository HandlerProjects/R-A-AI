import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { supabase } from "@/lib/supabase";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);

  // Find cartas that should be delivered today and haven't been notified yet
  const { data: cartas, error } = await supabase
    .from("cartas")
    .select("id")
    .lte("deliver_at", today)
    .eq("notified", false);

  if (error || !cartas?.length) return NextResponse.json({ sent: 0 });

  // Get Rut's push subscriptions
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_name", "rut");

  let sent = 0;

  if (subs?.length) {
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
    sent = results.filter((r) => r.status === "fulfilled").length;
  }

  // Mark all as notified
  await supabase
    .from("cartas")
    .update({ notified: true })
    .in("id", cartas.map((c) => c.id));

  return NextResponse.json({ sent, notified: cartas.length });
}

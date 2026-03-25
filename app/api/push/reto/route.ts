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
    const { toUser, bothDone } = await req.json() as { toUser: string; bothDone?: boolean };

    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_name", toUser);

    if (!subs?.length) return NextResponse.json({ sent: 0 });

    const fromName = toUser === "rut" ? "Alejandro" : "Rut";
    const payload = JSON.stringify({
      title: bothDone ? "🎲 ¡Los dos habéis completado el reto!" : `🎲 ${fromName} completó el reto de hoy`,
      body: bothDone ? "Ya podéis ver las respuestas del otro 👀" : "¿A qué esperas tú? 😏",
      url: `/${toUser}/reto`,
      tag: "reto",
    });

    const results = await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
        } catch (err: any) {
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
          }
          throw err;
        }
      })
    );

    return NextResponse.json({ sent: results.filter((r) => r.status === "fulfilled").length });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

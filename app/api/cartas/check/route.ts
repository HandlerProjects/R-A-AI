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

  // Cartas pendientes de notificación para cualquier destinatario
  const { data: cartas, error } = await supabase
    .from("cartas")
    .select("id, to_user, from_user")
    .lte("deliver_at", today)
    .eq("notified", false);

  if (error || !cartas?.length) return NextResponse.json({ sent: 0 });

  // Agrupar por destinatario
  const byRecipient: Record<string, string[]> = {};
  for (const c of cartas) {
    if (!byRecipient[c.to_user]) byRecipient[c.to_user] = [];
    byRecipient[c.to_user].push(c.id);
  }

  let sent = 0;

  for (const [toUser, ids] of Object.entries(byRecipient)) {
    const fromName = toUser === "rut" ? "Alejandro" : "Rut";

    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_name", toUser);

    if (!subs?.length) continue;

    const payload = JSON.stringify({
      title: `${fromName} te escribió una carta 💗`,
      body: "¿A qué esperas para leerla? 💌",
      url: `/${toUser}/cartas`,
      tag: "carta-nueva",
    });

    const results = await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
        } catch (err: any) {
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
          }
          throw err;
        }
      })
    );
    sent += results.filter((r) => r.status === "fulfilled").length;

    // Marcar como notificadas
    await supabase.from("cartas").update({ notified: true }).in("id", ids);
  }

  return NextResponse.json({ sent, notified: cartas.length });
}

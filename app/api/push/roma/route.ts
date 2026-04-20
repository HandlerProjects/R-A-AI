import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { supabase } from "@/lib/supabase";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const MESSAGES: Record<string, { title: string; body: string; tag: string }> = {
  salida: {
    title: "🚌 ¡Rumbo a Romaaaa! 🇮🇹",
    body: "El bus acaba de salir — en 3 horas estaréis en la ciudad eterna 💗",
    tag: "roma-salida",
  },
  llegada: {
    title: "🏛️ ¡Despierta, ya estás en Roma!",
    body: "La ciudad del amor os espera. ¡Bienvenidos! Abre la app para ver el plan 🇮🇹✨",
    tag: "roma-llegada",
  },
};

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tipo = req.nextUrl.searchParams.get("tipo") as "salida" | "llegada" | null;
  if (!tipo || !MESSAGES[tipo]) {
    return NextResponse.json({ error: "Missing or invalid tipo param" }, { status: 400 });
  }

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, user_name");

  if (error || !subs?.length) {
    return NextResponse.json({ sent: 0, error: error?.message });
  }

  const { title, body, tag } = MESSAGES[tipo];
  const payload = JSON.stringify({
    title,
    body,
    tag,
    url: "/alejandro/roma",
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

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({ sent, failed, tipo, title });
}

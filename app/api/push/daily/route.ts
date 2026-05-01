import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { supabase } from "@/lib/supabase";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const REUNION = new Date("2026-06-04T22:00:00Z"); // 4 junio medianoche CEST

function getPayload(daysLeft: number): { title: string; body: string } {
  if (daysLeft === 0) {
    return {
      title: "💗 ¡Por fin juntos!",
      body: "Hoy es el día — volvéis a estar juntos 🥹 Que sea un momento inolvidable ✨",
    };
  }
  if (daysLeft === 1) {
    return {
      title: "💗 ¡Mañana es el día!",
      body: "Solo queda 1 día para volver a teneros cerca 🥺 Ya casi…",
    };
  }

  const messages = [
    { title: `💗 ${daysLeft} días`, body: `Quedan ${daysLeft} días para volveros a ver 🌟 Cada uno vale la pena` },
    { title: `🩷 ${daysLeft} días`, body: `${daysLeft} días y ya estaréis juntos de nuevo 💗 Aguanta un poco más` },
    { title: `❤️ ${daysLeft} días`, body: `Cada día que pasa es un día menos separados 💫 ${daysLeft} días` },
    { title: `💗 Cuenta atrás`, body: `${daysLeft} días para fundiros con quien más queréis 🫂` },
    { title: `🌟 ${daysLeft} días`, body: `Os quedan ${daysLeft} días — y cada abrazo pendiente vale el doble 💗` },
    { title: `🩷 ${daysLeft} días menos`, body: `Un día menos de distancia, ${daysLeft} por delante 💪 Lo estáis haciendo genial` },
    { title: `💗 ${daysLeft} días`, body: `La distancia es solo temporal — en ${daysLeft} días desaparece 🥹✨` },
  ];

  return messages[daysLeft % messages.length];
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const diffMs = REUNION.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(diffMs / 86400000));

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth");

  if (error || !subs?.length) {
    return NextResponse.json({ sent: 0 });
  }

  const { title, body } = getPayload(daysLeft);
  const payload = JSON.stringify({ title, body, url: "/", tag: "daily-countdown" });

  const results = await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
      } catch (err: any) {
        // 410 Gone = subscription expired, clean it up
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        }
        throw err;
      }
    })
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return NextResponse.json({ sent, daysLeft, title });
}

import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { supabase } from "@/lib/supabase";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const REUNION = new Date("2026-04-16T00:00:00Z");

function getPayload(daysLeft: number): { title: string; body: string } {
  if (daysLeft === 0) {
    return {
      title: "💗 ¡Por fin juntos!",
      body: "Hoy es el día — Rut llega a Italia 🇮🇹 Que sea un momento inolvidable ✨",
    };
  }
  if (daysLeft === 1) {
    return {
      title: "💗 ¡Mañana es el día!",
      body: "Solo queda 1 día para volver a tenerte cerca 🥺🇮🇹",
    };
  }

  const messages = [
    { title: `💗 ${daysLeft} días`, body: `Quedan ${daysLeft} días para volver a ver a la luz de tus ojos 🌟` },
    { title: `🩷 ${daysLeft} días`, body: `${daysLeft} días y ya estaréis juntos en Italia 🇮🇹` },
    { title: `❤️ ${daysLeft} días`, body: `Cada día que pasa es un día menos sin el amor de tu vida 💫` },
    { title: `💗 ${daysLeft} días para Italia`, body: `${daysLeft} días y vuelves a tenerla cerca 🥺 Aguanta un poco más` },
    { title: `🌟 ${daysLeft} días`, body: `El 16 de abril os espera una cita en Italia — ${daysLeft} días 💗` },
    { title: `💗 Cuenta atrás`, body: `${daysLeft} días para fundirte con quien más quieres 🫂🇮🇹` },
    { title: `🩷 ${daysLeft} días`, body: `Rut llegará en ${daysLeft} días — cada segundo sin ella es demasiado largo 💗` },
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

  // Stop sending after reunion day
  if (diffMs < -86400000) {
    return NextResponse.json({ skipped: true, reason: "reunion already passed" });
  }

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth");

  if (error || !subs?.length) {
    return NextResponse.json({ sent: 0 });
  }

  const { title, body } = getPayload(daysLeft);
  const payload = JSON.stringify({ title, body, url: "/", tag: "daily-countdown" });

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return NextResponse.json({ sent, daysLeft, title });
}

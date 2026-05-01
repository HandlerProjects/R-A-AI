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
      title: "💗 Hoy es el día",
      body: "Se acabó la distancia. Esta noche volvéis a estar juntos — que sea tan bonito como lo habéis imaginado 🥹✨",
    };
  }
  if (daysLeft === 1) {
    return {
      title: "🌙 Mañana, mañana",
      body: "Un día más y ya está. Mañana esa distancia deja de existir y todo lo que se ha esperado vuelve a estar cerca 💗",
    };
  }
  if (daysLeft <= 7) {
    return {
      title: `💗 Solo ${daysLeft} días`,
      body: `Ya se huele. La recta final siempre se hace eterna — pero en ${daysLeft} días llega el abrazo que lo vale todo 🫂`,
    };
  }

  const messages = [
    {
      title: "Te echo de menos 💗",
      body: `${daysLeft} días. Hoy me ha faltado escuchar tu voz, sentirte cerca. Pero llegará 🥺`,
    },
    {
      title: `${daysLeft} días, amor`,
      body: "Cierro los ojos y casi te siento. Solo un poco más y esta distancia deja de existir para siempre 💫",
    },
    {
      title: "Aguanta un poco más 🌙",
      body: `${daysLeft} días quedan. No hay nada que no se cure con un abrazo tuyo de verdad 🫂`,
    },
    {
      title: `${daysLeft} días menos 💗`,
      body: "Cada buenas noches por pantalla tiene fecha de caducidad. Y se acerca 🥹",
    },
    {
      title: "Lo estáis haciendo genial 💪",
      body: `La distancia duele porque lo que tenéis es muy real. En ${daysLeft} días desaparece ✨`,
    },
    {
      title: `${daysLeft} días y ya está 🌟`,
      body: "El próximo abrazo no va a durar nada — va a durar todo. Falta muy poco 💗",
    },
    {
      title: "Hoy también os habéis echado de menos 💗",
      body: `Y eso es lo más bonito que existe. En ${daysLeft} días, vuelve a estar todo bien 🥺`,
    },
    {
      title: `${daysLeft} días de valentía 🩷`,
      body: "Sois de esas parejas que demuestran que el amor de verdad no necesita estar al lado para existir 💗",
    },
    {
      title: "Os quedan mensajes de voz 🎙️",
      body: `${daysLeft} días más de mensajes de voz — después son susurros de verdad 🥹`,
    },
    {
      title: `${daysLeft} días 💗`,
      body: "Cada foto que os mandáis, cada buenas noches, cada 'te quiero' por pantalla… todo eso tiene recompensa 🌟",
    },
    {
      title: "La distancia no os define 💫",
      body: `Os define lo que sentís. Y eso no lo separa nada. ${daysLeft} días y volvéis a demostrarlo en persona 💗`,
    },
    {
      title: `Queda poco, de verdad 🥺`,
      body: `${daysLeft} días. Estáis escribiendo la historia más bonita — y el mejor capítulo llega pronto 💗`,
    },
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

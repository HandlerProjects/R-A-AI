import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { supabase } from "@/lib/supabase";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const MESSAGES: Record<string, { title: string; body: string; url: string }> = {
  rut: {
    title: "Alejandro te escribió una carta 💗",
    body: "¿A qué esperas para leerla?",
    url: "/rut/cartas",
  },
  alejandro: {
    title: "Rut te escribió una carta 💗",
    body: "¿A qué esperas para leerla?",
    url: "/alejandro/cartas",
  },
};

export async function POST(req: NextRequest) {
  try {
    const { toUser } = await req.json() as { toUser: string };
    const msg = MESSAGES[toUser];
    if (!msg) return NextResponse.json({ error: "Invalid toUser" }, { status: 400 });

    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_name", toUser);

    if (error || !subs?.length) return NextResponse.json({ sent: 0 });

    const payload = JSON.stringify({ ...msg, tag: "carta-nueva" });

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      )
    );

    return NextResponse.json({ sent: results.filter((r) => r.status === "fulfilled").length });
  } catch (err) {
    console.error("carta push error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

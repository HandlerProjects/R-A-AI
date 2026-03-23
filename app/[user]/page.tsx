"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useUserStore, UserName } from "@/store/userStore";
import { NotificationCard } from "@/components/NotificationCard";

const SHARED_MODULES = [
  { id: "plans", icon: "💑", title: "Planes", description: "Cread el plan perfecto juntos", color: "linear-gradient(135deg, #FF2D55 0%, #FF6B35 100%)" },
  { id: "italian", icon: "🇮🇹", title: "Italiano", description: "Aprended juntos o por separado", color: "linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%)" },
  { id: "chat", icon: "💬", title: "Chat R&A", description: "IA con contexto de los dos", color: "linear-gradient(135deg, #AF52DE 0%, #FF2D55 100%)" },
  { id: "viajes", icon: "🌍", title: "Viajes", description: "Descubrid el mundo juntos", color: "linear-gradient(135deg, #007AFF 0%, #34C759 100%)" },
];

const ALEJANDRO_MODULES = [
  { id: "rut", icon: "💗", title: "Rut", description: "Sus pequeños detalles" },
  { id: "proyectos", icon: "🚀", title: "Proyectos", description: "APISA, Autoescuela, SOLØN..." },
  { id: "outfits", icon: "👔", title: "Outfits", description: "Armario y combinaciones" },
  { id: "comidas", icon: "🥗", title: "Comidas", description: "Nutrición y recetas" },
  { id: "posts", icon: "📱", title: "Posts", description: "Instagram y LinkedIn" },
  { id: "prompts", icon: "✍️", title: "Prompts", description: "Para todas las IAs" },
  { id: "psicologo", icon: "🧘", title: "Psicólogo", description: "Tu espacio privado" },
];

const RUT_MODULES = [
  { id: "yopuedo", icon: "✨", title: "Yo puedo", description: "Metas diarias y crecimiento" },
  { id: "tfg", icon: "🎓", title: "TFG", description: "Redacción, APA, análisis" },
  { id: "estudios", icon: "📚", title: "Estudios", description: "Resúmenes y exámenes" },
  { id: "comidas", icon: "🥗", title: "Comidas", description: "Nutrición y recetas" },
  { id: "prompts", icon: "✍️", title: "Prompts", description: "Adaptado a tus necesidades" },
  { id: "psicologo", icon: "🧘", title: "Psicólogo", description: "Tu espacio privado" },
];

export default function HomePage() {
  const params = useParams();
  const router = useRouter();
  const { activeUser, setUser } = useUserStore();
  const userParam = params.user as UserName;

  useEffect(() => {
    if (userParam && userParam !== activeUser) setUser(userParam, userParam);
  }, [userParam, activeUser, setUser]);

  const isAlejandro = userParam === "alejandro";
  const displayName = isAlejandro ? "Alejandro" : "Rut";
  const accentColor = isAlejandro ? "#1C1C1E" : "#FF2D55";
  const ownModules = isAlejandro ? ALEJANDRO_MODULES : RUT_MODULES;
  const greeting = getGreeting();

  const [countdown, setCountdown] = useState<{ days: number; hours: number; done: boolean } | null>(null);
  useEffect(() => {
    const target = new Date("2026-04-16T00:00:00").getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setCountdown({ days: 0, hours: 0, done: true }); return; }
      setCountdown({ days: Math.floor(diff / 86400000), hours: Math.floor((diff % 86400000) / 3600000), done: false });
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg-primary)", overflow: "hidden" }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          padding: "16px 20px 12px",
          paddingTop: `calc(16px + env(safe-area-inset-top))`,
          background: "rgba(242,242,247,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0, fontWeight: 400 }}>{greeting}</p>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)", margin: "1px 0 0", letterSpacing: "-0.5px", fontFamily: "-apple-system, 'SF Pro Display', sans-serif" }}>
              {displayName}
            </h1>
          </div>

          {/* Countdown badge */}
          {countdown && !countdown.done && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 22 }}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                background: "linear-gradient(135deg, #fff0f3 0%, #fff5f0 100%)",
                border: "1px solid rgba(255,45,85,0.2)",
                borderRadius: 14, padding: "6px 10px",
                boxShadow: "0 2px 10px rgba(255,45,85,0.12)",
                marginRight: 8,
              }}
            >
              <div style={{ display: "flex", gap: 3 }}>
                {["💗", "🩷"].map((h, i) => (
                  <motion.span key={i} animate={{ y: [0, -3, 0] }} transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }} style={{ fontSize: 11 }}>{h}</motion.span>
                ))}
              </div>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#FF2D55", lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
                {countdown.days}d {countdown.hours}h
              </span>
              <span style={{ fontSize: 8, fontWeight: 600, color: "#FF2D55", opacity: 0.55, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Italia 🇮🇹
              </span>
            </motion.div>
          )}

          <button
            onClick={() => router.push("/")}
            style={{
              width: 44, height: 44, borderRadius: "50%",
              background: accentColor,
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              overflow: "hidden",
            }}
          >
            <img
              src={isAlejandro ? "/avatar_alejandro.png" : "/avatar_rut.png"}
              alt={displayName}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <span style={{ fontSize: 18, fontWeight: 700, color: "white", display: "none" }}>
              {displayName[0]}
            </span>
          </button>
        </div>

        {/* Status */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 10, background: "rgba(52,199,89,0.12)", border: "1px solid rgba(52,199,89,0.25)", borderRadius: 20, padding: "4px 10px" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34C759" }} />
          <span style={{ fontSize: 11, color: "#34C759", fontWeight: 600 }}>R&A activo</span>
        </div>
      </motion.div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", paddingBottom: `calc(84px + env(safe-area-inset-bottom))` }}>

        {/* SHARED MODULES — primero */}
        <section style={{ marginBottom: 28 }}>
          <SectionLabel text="Con Rut" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {SHARED_MODULES.map((mod, i) => (
              <SharedModuleCard
                key={mod.id}
                mod={mod}
                userParam={userParam}
                delay={i * 0.05}
                router={router}
              />
            ))}
          </div>
        </section>

        {/* OWN MODULES */}
        <section>
          <SectionLabel text="Tus módulos" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {ownModules.map((mod, i) => (
              <OwnModuleCard
                key={mod.id}
                mod={mod}
                userParam={userParam}
                delay={0.1 + i * 0.04}
                router={router}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Push notification card */}
      {!countdown?.done && <NotificationCard userName={userParam} />}

      {/* Bottom Nav */}
      <BottomNav userParam={userParam} router={router} />
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-quaternary)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 10 }}>
      {text}
    </p>
  );
}

function SharedModuleCard({ mod, userParam, delay, router }: any) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24, delay }}
      whileTap={{ scale: 0.97 }}
      onClick={() => router.push(`/${userParam}/${mod.id}`)}
      style={{
        background: mod.color,
        border: "none",
        borderRadius: 18,
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        cursor: "pointer",
        textAlign: "left",
        boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
      }}
    >
      <span style={{ fontSize: 30, flexShrink: 0 }}>{mod.icon}</span>
      <div>
        <p style={{ fontSize: 16, fontWeight: 700, color: "white", margin: 0, letterSpacing: "-0.2px" }}>{mod.title}</p>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", margin: "2px 0 0" }}>{mod.description}</p>
      </div>
      <div style={{ marginLeft: "auto", color: "rgba(255,255,255,0.6)", fontSize: 18 }}>›</div>
    </motion.button>
  );
}

function OwnModuleCard({ mod, userParam, delay, router }: any) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24, delay }}
      whileTap={{ scale: 0.96 }}
      onClick={() => router.push(`/${userParam}/${mod.id}`)}
      style={{
        background: "white",
        border: "1px solid rgba(0,0,0,0.06)",
        borderRadius: 18,
        padding: "18px 14px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 8,
        cursor: "pointer",
        textAlign: "left",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}
    >
      <span style={{ fontSize: 26 }}>{mod.icon}</span>
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: 0, lineHeight: 1.3 }}>{mod.title}</p>
        <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: "3px 0 0", lineHeight: 1.4 }}>{mod.description}</p>
      </div>
    </motion.button>
  );
}

function BottomNav({ userParam, router }: { userParam: string; router: any }) {
  const items = [
    { icon: "⊞", label: "Inicio", href: `/${userParam}` },
    { icon: "💬", label: "Chat", href: `/${userParam}/chat` },
    { icon: "👤", label: "Perfil", href: `/${userParam}/profile` },
  ];
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "rgba(242,242,247,0.92)",
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      borderTop: "1px solid rgba(0,0,0,0.08)",
      display: "flex", justifyContent: "space-around", alignItems: "center",
      paddingBottom: "env(safe-area-inset-bottom)",
      paddingTop: 8, zIndex: 100,
    }}>
      {items.map((item) => (
        <button key={item.href} onClick={() => router.push(item.href)}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 20px", background: "none", border: "none", cursor: "pointer", opacity: 0.6 }}
        >
          <span style={{ fontSize: 22 }}>{item.icon}</span>
          <span style={{ fontSize: 10, fontWeight: 500, color: "var(--text-primary)" }}>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return "Buenas noches";
  if (h < 14) return "Buenos días";
  if (h < 21) return "Buenas tardes";
  return "Buenas noches";
}

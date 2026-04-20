"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useUserStore, UserName } from "@/store/userStore";
import { NotificationCard } from "@/components/NotificationCard";

const SHARED_MODULES = [
  { id: "carnet", icon: "💕", title: "Nuestros carnets", description: "Alejandro & Rut · pareja oficial", color: "linear-gradient(135deg, #1C1C1E 0%, #FF2D55 100%)" },
  { id: "carnet?tab=puntos", icon: "⚡", title: "Puntos R&A", description: "Gana, pierde y recupera puntos", color: "linear-gradient(135deg, #ea580c 0%, #f97316 100%)" },
  { id: "contrato", icon: "📜", title: "Contrato de pareja", description: "Nuestro pacto oficial · firmado", color: "linear-gradient(135deg, #8b5a2b 0%, #c9a96e 100%)" },
  { id: "plans", icon: "💑", title: "Planes", description: "Cread el plan perfecto juntos", color: "linear-gradient(135deg, #FF2D55 0%, #FF6B35 100%)" },
  { id: "italian", icon: "🇮🇹", title: "Italiano", description: "Aprended juntos o por separado", color: "linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%)" },
  { id: "chat", icon: "💬", title: "Chat R&A", description: "IA con contexto de los dos", color: "linear-gradient(135deg, #AF52DE 0%, #FF2D55 100%)" },
  { id: "viajes", icon: "🌍", title: "Viajes", description: "Descubrid el mundo juntos", color: "linear-gradient(135deg, #007AFF 0%, #34C759 100%)" },
];

const DAILY_MODULES = [
  { id: "reto", icon: "🎲", title: "Reto del día", description: "El mismo reto para los dos", color: "linear-gradient(135deg, #FF6B35 0%, #FF2D55 100%)" },
  { id: "pregunta", icon: "❓", title: "Pregunta del día", description: "Responded y comparad", color: "linear-gradient(135deg, #007AFF 0%, #AF52DE 100%)" },
  { id: "preferias", icon: "🤔", title: "¿Qué preferirías?", description: "Proponed y comparad elecciones", color: "linear-gradient(135deg, #AF52DE 0%, #FF2D55 100%)" },
  { id: "tarro", icon: "🫙", title: "Tarro de momentos", description: "Guardad lo que os importa", color: "linear-gradient(135deg, #AF52DE 0%, #FF9F0A 100%)" },
];

const ALEJANDRO_MODULES = [
  { id: "rut", icon: "💗", title: "Rut", description: "Sus pequeños detalles" },
  { id: "cartas", icon: "💌", title: "Cartas", description: "Escríbele cuando quieras" },
  { id: "proyectos", icon: "🚀", title: "Proyectos", description: "APISA, Autoescuela, SOLØN..." },
  { id: "outfits", icon: "👔", title: "Outfits", description: "Armario y combinaciones" },
  { id: "comidas", icon: "🥗", title: "Comidas", description: "Nutrición y recetas" },
  { id: "posts", icon: "📱", title: "Posts", description: "Instagram y LinkedIn" },
  { id: "prompts", icon: "✍️", title: "Prompts", description: "Para todas las IAs" },
  { id: "psicologo", icon: "🧘", title: "Psicólogo", description: "Tu espacio privado" },
];

const RUT_MODULES = [
  { id: "yopuedo", icon: "✨", title: "Yo puedo", description: "Metas diarias y crecimiento" },
  { id: "cartas", icon: "💌", title: "Cartas", description: "De Alejandro para ti" },
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

  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; done: boolean } | null>(null);
  useEffect(() => {
    const target = new Date("2026-04-24T05:20:00").getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setCountdown({ days: 0, hours: 0, minutes: 0, done: true }); return; }
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        done: false,
      });
    };
    tick();
    const id = setInterval(tick, 30000);
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

          {/* Roma countdown mini badge */}
          {countdown && !countdown.done && (
            <motion.button
              onClick={() => router.push(`/${userParam}/roma`)}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 22 }}
              whileTap={{ scale: 0.93 }}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                background: "linear-gradient(135deg, #0a0a0f 0%, #1a0a2e 100%)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 14, padding: "7px 11px",
                boxShadow: "0 4px 16px rgba(0,0,80,0.25)",
                marginRight: 8, cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 14 }}>🇮🇹</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: "white", lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
                {countdown.days}d {countdown.hours}h
              </span>
              <span style={{ fontSize: 8, fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Roma
              </span>
            </motion.button>
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

        {/* ROMA CARD */}
        {countdown && !countdown.done && (
          <motion.button
            onClick={() => router.push(`/${userParam}/roma`)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            whileTap={{ scale: 0.97 }}
            style={{ width: "100%", marginBottom: 20, borderRadius: 22, overflow: "hidden", border: "none", cursor: "pointer", padding: 0, background: "none", display: "block" }}
          >
            <div style={{ background: "linear-gradient(135deg, #0a0a0f 0%, #101428 50%, #0f1a0a 100%)", padding: "18px 20px", position: "relative", overflow: "hidden", borderRadius: 22, border: "1px solid rgba(255,255,255,0.08)" }}>
              {/* Decorative circles */}
              <div style={{ position: "absolute", top: -30, right: -20, width: 130, height: 130, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,122,255,0.2) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: -20, left: 20, width: 100, height: 100, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,45,85,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
                <div style={{ textAlign: "left" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 22 }}>🇮🇹</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: "white", letterSpacing: "-0.3px" }}>Roma · 24–25 Abr</span>
                  </div>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 12px", fontWeight: 500 }}>
                    🚌 05:20 · 🏛️ Coliseo · ⛪ Vaticano
                  </p>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[
                      { v: countdown.days, l: "días" },
                      { v: countdown.hours, l: "horas" },
                      { v: countdown.minutes, l: "min" },
                    ].map(({ v, l }) => (
                      <div key={l} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "white", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{String(v).padStart(2, "0")}</div>
                        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ fontSize: 40 }}>🏛️</div>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Ver plan →</span>
                </div>
              </div>
            </div>
          </motion.button>
        )}

        {/* DAILY MODULES */}
        <section style={{ marginBottom: 28 }}>
          <SectionLabel text="Cada día" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {DAILY_MODULES.map((mod, i) => (
              <SharedModuleCard key={mod.id} mod={mod} userParam={userParam} delay={i * 0.05} router={router} />
            ))}
          </div>
        </section>

        {/* SHARED MODULES */}
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
        <section style={{ marginBottom: 24 }}>
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

        {/* VER PERFIL DEL OTRO */}
        <section>
          <SectionLabel text={isAlejandro ? "Ver a Rut" : "Ver a Alejandro"} />
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 280, damping: 24 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push(isAlejandro ? "/rut" : "/alejandro")}
            style={{
              width: "100%",
              background: isAlejandro
                ? "linear-gradient(135deg, #FF2D55 0%, #AF52DE 100%)"
                : "linear-gradient(135deg, #1C1C1E 0%, #3A3A3C 100%)",
              border: "none",
              borderRadius: 18,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              cursor: "pointer",
              textAlign: "left",
              boxShadow: "0 4px 18px rgba(0,0,0,0.15)",
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden", flexShrink: 0,
            }}>
              <img
                src={isAlejandro ? "/avatar_rut.png" : "/avatar_alejandro.png"}
                alt={isAlejandro ? "Rut" : "Alejandro"}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "white", margin: 0 }}>
                {isAlejandro ? "Ver todo de Rut" : "Ver todo de Alejandro"}
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", margin: "2px 0 0" }}>
                Módulos, conversaciones y más
              </p>
            </div>
            <div style={{ marginLeft: "auto", color: "rgba(255,255,255,0.5)", fontSize: 20 }}>›</div>
          </motion.button>
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

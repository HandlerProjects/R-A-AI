"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore, UserName } from "@/store/userStore";
import { NotificationCard } from "@/components/NotificationCard";

const REUNION = new Date("2026-06-04T22:00:00Z"); // 4 junio medianoche CEST

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

const ALEJANDRO_PERSONAL = [
  { id: "cartas", icon: "💌", title: "Cartas", description: "Escríbele cuando quieras" },
  { id: "psicologo", icon: "🧘", title: "Psicólogo", description: "Tu espacio privado" },
];

const RUT_PERSONAL = [
  { id: "tfg", icon: "🎓", title: "TFG", description: "Redacción, APA, análisis" },
  { id: "estudios", icon: "📚", title: "Estudios", description: "Resúmenes y exámenes" },
  { id: "psicologo", icon: "🧘", title: "Psicólogo", description: "Tu espacio privado" },
];

type Countdown = { days: number; hours: number; minutes: number; seconds: number; done: boolean };

function useCountdown(): Countdown {
  const calc = (): Countdown => {
    const diff = REUNION.getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
      done: false,
    };
  };
  const [cd, setCd] = useState<Countdown>(calc);
  useEffect(() => {
    const id = setInterval(() => setCd(calc()), 1000);
    return () => clearInterval(id);
  }, []);
  return cd;
}

type CarinoTipo = "beso" | "abrazo";
type FloatingEmoji = { id: number; tipo: CarinoTipo; x: number };

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
  const personalModules = isAlejandro ? ALEJANDRO_PERSONAL : RUT_PERSONAL;
  const greeting = getGreeting();
  const cd = useCountdown();

  // ── Cariño virtual ──────────────────────────────────────────────────────────
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [cooldowns, setCooldowns] = useState<Record<CarinoTipo, boolean>>({ beso: false, abrazo: false });
  const [sending, setSending] = useState<CarinoTipo | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const sendCarino = useCallback(async (tipo: CarinoTipo) => {
    if (cooldowns[tipo] || sending) return;
    setSending(tipo);
    setCooldowns((p) => ({ ...p, [tipo]: true }));

    // Floating emojis
    const count = tipo === "beso" ? 5 : 4;
    const newEmojis: FloatingEmoji[] = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      tipo,
      x: 30 + Math.random() * 40,
    }));
    setFloatingEmojis((p) => [...p, ...newEmojis]);
    setTimeout(() => setFloatingEmojis((p) => p.filter((e) => !newEmojis.find((n) => n.id === e.id))), 2000);

    try {
      await fetch("/api/push/carino", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromUser: userParam, tipo }),
      });
      setToast(tipo === "beso" ? "💋 ¡Beso enviado!" : "🤗 ¡Abrazo enviado!");
    } catch {
      setToast("✓ ¡Enviado!");
    }

    setSending(null);
    setTimeout(() => setToast(null), 2500);
    setTimeout(() => setCooldowns((p) => ({ ...p, [tipo]: false })), 8000);
  }, [cooldowns, sending, userParam]);

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

          {/* Mini badge */}
          {!cd.done && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 22 }}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                background: "linear-gradient(135deg, #1a0a2e 0%, #2d0a1a 100%)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 14, padding: "7px 11px",
                boxShadow: "0 4px 16px rgba(80,0,80,0.25)",
                marginRight: 8,
              }}
            >
              <span style={{ fontSize: 14 }}>💗</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: "white", lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
                {cd.days}d {cd.hours}h
              </span>
              <span style={{ fontSize: 8, fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Reunión
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
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </button>
        </div>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 10, background: "rgba(52,199,89,0.12)", border: "1px solid rgba(52,199,89,0.25)", borderRadius: 20, padding: "4px 10px" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34C759" }} />
          <span style={{ fontSize: 11, color: "#34C759", fontWeight: 600 }}>R&A activo</span>
        </div>
      </motion.div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", paddingBottom: `calc(84px + env(safe-area-inset-bottom))` }}>

        {/* ── CONTADOR INTERACTIVO ────────────────────────────────── */}
        {!cd.done && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            style={{
              marginBottom: 20, borderRadius: 24, overflow: "visible",
              background: "linear-gradient(160deg, #0f0015 0%, #1a0030 40%, #0d001a 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 8px 32px rgba(100,0,150,0.25)",
              position: "relative",
            }}
          >
            {/* Floating emojis */}
            <AnimatePresence>
              {floatingEmojis.map((e) => (
                <motion.span
                  key={e.id}
                  initial={{ opacity: 1, y: 0, scale: 1 }}
                  animate={{ opacity: 0, y: -80, scale: 1.4 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.4, ease: "easeOut" }}
                  style={{
                    position: "absolute", top: "40%", left: `${e.x}%`,
                    fontSize: 26, zIndex: 50, pointerEvents: "none",
                    filter: "drop-shadow(0 0 8px rgba(255,100,200,0.6))",
                  }}
                >
                  {e.tipo === "beso" ? "💋" : "🤗"}
                </motion.span>
              ))}
            </AnimatePresence>

            {/* Toast */}
            <AnimatePresence>
              {toast && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  style={{
                    position: "absolute", top: -36, left: "50%", transform: "translateX(-50%)",
                    background: "rgba(255,255,255,0.95)", borderRadius: 20,
                    padding: "6px 14px", fontSize: 13, fontWeight: 700,
                    color: "#1C1C1E", whiteSpace: "nowrap",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.2)", zIndex: 60,
                  }}
                >
                  {toast}
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ padding: "20px 20px 18px" }}>
              {/* Top label */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                <span style={{ fontSize: 16 }}>💗</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Próxima reunión · 4 Jun
                </span>
              </div>

              {/* Countdown */}
              <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
                {[
                  { v: cd.days, l: "días" },
                  { v: cd.hours, l: "horas" },
                  { v: cd.minutes, l: "min" },
                  { v: cd.seconds, l: "seg" },
                ].map(({ v, l }) => (
                  <div key={l} style={{
                    flex: 1, background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 14, padding: "10px 6px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "white", fontVariantNumeric: "tabular-nums", lineHeight: 1, letterSpacing: "-0.5px" }}>
                      {String(v).padStart(2, "0")}
                    </div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 3 }}>
                      {l}
                    </div>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: "rgba(255,255,255,0.07)", marginBottom: 16 }} />

              {/* Cariño label */}
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textAlign: "center", margin: "0 0 12px", fontWeight: 500 }}>
                Manda algo para que el tiempo pase más rápido 💫
              </p>

              {/* Buttons */}
              <div style={{ display: "flex", gap: 10 }}>
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => sendCarino("beso")}
                  disabled={cooldowns.beso || !!sending}
                  style={{
                    flex: 1, padding: "12px 8px",
                    background: cooldowns.beso
                      ? "rgba(255,255,255,0.04)"
                      : "linear-gradient(135deg, rgba(255,45,85,0.25), rgba(255,100,150,0.15))",
                    border: cooldowns.beso ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(255,45,85,0.35)",
                    borderRadius: 16, cursor: cooldowns.beso ? "default" : "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    transition: "all 0.3s",
                  }}
                >
                  <span style={{ fontSize: 22, filter: cooldowns.beso ? "grayscale(1) opacity(0.4)" : "none" }}>💋</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: cooldowns.beso ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.85)" }}>
                    {cooldowns.beso ? "Enviado 💗" : "Mandar beso"}
                  </span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => sendCarino("abrazo")}
                  disabled={cooldowns.abrazo || !!sending}
                  style={{
                    flex: 1, padding: "12px 8px",
                    background: cooldowns.abrazo
                      ? "rgba(255,255,255,0.04)"
                      : "linear-gradient(135deg, rgba(175,82,222,0.25), rgba(100,50,200,0.15))",
                    border: cooldowns.abrazo ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(175,82,222,0.35)",
                    borderRadius: 16, cursor: cooldowns.abrazo ? "default" : "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    transition: "all 0.3s",
                  }}
                >
                  <span style={{ fontSize: 22, filter: cooldowns.abrazo ? "grayscale(1) opacity(0.4)" : "none" }}>🤗</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: cooldowns.abrazo ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.85)" }}>
                    {cooldowns.abrazo ? "Enviado 💗" : "Mandar abrazo"}
                  </span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── CADA DÍA ── 2x2 grid ───────────────────────────────── */}
        <section style={{ marginBottom: 24 }}>
          <SectionLabel text="Cada día" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {DAILY_MODULES.map((mod, i) => (
              <DailyCard key={mod.id} mod={mod} userParam={userParam} delay={i * 0.05} router={router} />
            ))}
          </div>
        </section>

        {/* ── CON RUT ── Chat hero + grid 2-col ───────────────────── */}
        <section style={{ marginBottom: 24 }}>
          <SectionLabel text={isAlejandro ? "Con Rut" : "Con Alejandro"} />
          {/* Chat hero */}
          <motion.button
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push(`/${userParam}/chat`)}
            style={{
              width: "100%", marginBottom: 10,
              background: "linear-gradient(135deg, #AF52DE 0%, #FF2D55 100%)",
              border: "none", borderRadius: 20, padding: "20px 22px",
              display: "flex", alignItems: "center", gap: 16,
              cursor: "pointer", textAlign: "left",
              boxShadow: "0 6px 24px rgba(175,82,222,0.28)",
            }}
          >
            <span style={{ fontSize: 34 }}>💬</span>
            <div>
              <p style={{ fontSize: 17, fontWeight: 800, color: "white", margin: 0, letterSpacing: "-0.3px" }}>Chat R&A</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", margin: "2px 0 0" }}>IA con contexto de los dos</p>
            </div>
            <div style={{ marginLeft: "auto", color: "rgba(255,255,255,0.6)", fontSize: 20 }}>›</div>
          </motion.button>
          {/* Rest in 2-col compact grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {SHARED_MODULES.filter(m => m.id !== "chat").map((mod, i) => (
              <CompactCard key={mod.id} mod={mod} userParam={userParam} delay={0.1 + i * 0.04} router={router} />
            ))}
          </div>
        </section>

        {/* ── SOLO TÚ ──────────────────────────────────────────────── */}
        <section style={{ marginBottom: 24 }}>
          <SectionLabel text="Solo tú" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {personalModules.map((mod, i) => (
              <PersonalCard key={mod.id} mod={mod} userParam={userParam} delay={0.1 + i * 0.06} router={router} isAlejandro={isAlejandro} />
            ))}
          </div>
        </section>

        {/* ── VER AL OTRO ────────────────────────────────────────── */}
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

      <NotificationCard userName={userParam} />
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

function DailyCard({ mod, userParam, delay, router }: any) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 26, delay }}
      whileTap={{ scale: 0.94 }}
      onClick={() => router.push(`/${userParam}/${mod.id}`)}
      style={{
        background: mod.color,
        border: "none",
        borderRadius: 20,
        padding: "18px 14px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 10,
        cursor: "pointer",
        textAlign: "left",
        boxShadow: "0 4px 18px rgba(0,0,0,0.14)",
        minHeight: 110,
      }}
    >
      <span style={{ fontSize: 28 }}>{mod.icon}</span>
      <div>
        <p style={{ fontSize: 14, fontWeight: 700, color: "white", margin: 0, lineHeight: 1.3 }}>{mod.title}</p>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", margin: "3px 0 0", lineHeight: 1.3 }}>{mod.description}</p>
      </div>
    </motion.button>
  );
}

function CompactCard({ mod, userParam, delay, router }: any) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 26, delay }}
      whileTap={{ scale: 0.94 }}
      onClick={() => router.push(`/${userParam}/${mod.id}`)}
      style={{
        background: mod.color,
        border: "none",
        borderRadius: 18,
        padding: "16px 14px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 8,
        cursor: "pointer",
        textAlign: "left",
        boxShadow: "0 3px 14px rgba(0,0,0,0.12)",
        minHeight: 96,
      }}
    >
      <span style={{ fontSize: 24 }}>{mod.icon}</span>
      <p style={{ fontSize: 13, fontWeight: 700, color: "white", margin: 0, lineHeight: 1.3 }}>{mod.title}</p>
    </motion.button>
  );
}

function PersonalCard({ mod, userParam, delay, router, isAlejandro }: any) {
  const isCartas = mod.id === "cartas";
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24, delay }}
      whileTap={{ scale: 0.97 }}
      onClick={() => router.push(`/${userParam}/${mod.id}`)}
      style={{
        background: isCartas
          ? "linear-gradient(135deg, #7A1231 0%, #C42B5B 100%)"
          : "white",
        border: isCartas ? "none" : "1px solid rgba(0,0,0,0.07)",
        borderRadius: 18,
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        cursor: "pointer",
        textAlign: "left",
        boxShadow: isCartas
          ? "0 6px 24px rgba(196,43,91,0.28)"
          : "0 2px 10px rgba(0,0,0,0.06)",
        width: "100%",
      }}
    >
      <span style={{ fontSize: 30, flexShrink: 0 }}>{mod.icon}</span>
      <div>
        <p style={{ fontSize: 16, fontWeight: 700, color: isCartas ? "white" : "var(--text-primary)", margin: 0, letterSpacing: "-0.2px" }}>
          {mod.title}
        </p>
        <p style={{ fontSize: 12, color: isCartas ? "rgba(255,255,255,0.65)" : "var(--text-tertiary)", margin: "2px 0 0" }}>
          {mod.description}
        </p>
      </div>
      <div style={{ marginLeft: "auto", color: isCartas ? "rgba(255,255,255,0.5)" : "var(--text-quaternary)", fontSize: 18 }}>›</div>
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

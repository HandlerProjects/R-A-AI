"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { loadDetalles, loadSueno, type Detalle } from "@/lib/yopuedo";

const ACCENT = "#AF52DE";
const ACCENT2 = "#FF2D55";
const RUT_USER_ID = "rut";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr() {
  return new Date(Date.now() - 86400000).toISOString().slice(0, 10);
}

function formatDate(dateStr: string): string {
  const today = todayStr();
  const yesterday = yesterdayStr();
  if (dateStr === today) return "Hoy";
  if (dateStr === yesterday) return "Ayer";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
}

export default function RutPage() {
  const params = useParams();
  const router = useRouter();
  const userParam = params.user as string;

  const [detalles, setDetalles] = useState<Detalle[]>([]);
  const [sueno, setSueno] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      loadDetalles(RUT_USER_ID),
      loadSueno(RUT_USER_ID),
    ]).then(([d, s]) => {
      setDetalles(d);
      setSueno(s);
      setLoading(false);
    });
  }, []);

  // Group detalles by date
  const grouped: Record<string, Detalle[]> = {};
  for (const d of detalles) {
    if (!grouped[d.date]) grouped[d.date] = [];
    grouped[d.date].push(d);
  }
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const hasToday = !!grouped[todayStr()]?.length;
  const total = detalles.length;

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg-primary)", overflow: "hidden" }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: "14px 20px 14px",
          paddingTop: `calc(14px + env(safe-area-inset-top))`,
          background: "rgba(242,242,247,0.9)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          flexShrink: 0, zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.back()}
            style={{ background: "rgba(0,0,0,0.06)", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="#1C1C1E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.3px" }}>
              Rut 💗
            </h1>
            <p style={{ fontSize: 11, color: ACCENT, margin: 0, fontWeight: 500 }}>
              Sus pequeños detalles
            </p>
          </div>
          {/* Today indicator */}
          <div style={{
            padding: "5px 10px", borderRadius: 20,
            background: hasToday ? "rgba(52,199,89,0.12)" : "rgba(0,0,0,0.05)",
            border: `1px solid ${hasToday ? "rgba(52,199,89,0.3)" : "rgba(0,0,0,0.08)"}`,
          }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: hasToday ? "#34C759" : "var(--text-quaternary)" }}>
              {hasToday ? "✓ Escribió hoy" : "Aún no hoy"}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", paddingBottom: `calc(84px + env(safe-area-inset-bottom))` }}>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-quaternary)", fontSize: 14 }}>Cargando…</div>
        ) : (
          <>
            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: "flex", gap: 10, marginBottom: 20 }}
            >
              <div style={{
                flex: 1, background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT2} 100%)`,
                borderRadius: 16, padding: "14px 12px", textAlign: "center",
                boxShadow: "0 4px 16px rgba(175,82,222,0.2)",
              }}>
                <p style={{ fontSize: 26, fontWeight: 800, color: "white", margin: 0, lineHeight: 1 }}>{total}</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", margin: "3px 0 0" }}>detalles totales</p>
              </div>
              <div style={{
                flex: 1, background: "white", border: "1px solid rgba(0,0,0,0.06)",
                borderRadius: 16, padding: "14px 12px", textAlign: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}>
                <p style={{ fontSize: 26, fontWeight: 800, color: ACCENT2, margin: 0, lineHeight: 1 }}>{sortedDates.length}</p>
                <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: "3px 0 0" }}>días con algo</p>
              </div>
              <div style={{
                flex: 1, background: "white", border: "1px solid rgba(0,0,0,0.06)",
                borderRadius: 16, padding: "14px 12px", textAlign: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}>
                <p style={{ fontSize: 22, margin: 0, lineHeight: 1 }}>{hasToday ? "💗" : "🌙"}</p>
                <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: "3px 0 0" }}>{hasToday ? "activa hoy" : "descansando"}</p>
              </div>
            </motion.div>

            {/* Sueño */}
            <AnimatePresence>
              {sueno && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  style={{
                    background: "white", border: "1px solid rgba(175,82,222,0.15)",
                    borderRadius: 20, padding: "18px 18px", marginBottom: 20,
                    boxShadow: "0 2px 12px rgba(175,82,222,0.08)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 20 }}>🌙</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Su sueño</p>
                      <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0 }}>Lo que quiere, sin límites</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 500, color: ACCENT, margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
                    "{sueno}"
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty state */}
            {detalles.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                style={{
                  textAlign: "center", padding: "40px 20px",
                  background: "white", borderRadius: 20,
                  border: "1px solid rgba(0,0,0,0.06)",
                }}
              >
                <p style={{ fontSize: 32, margin: "0 0 12px" }}>🌸</p>
                <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 6px" }}>
                  Aún no ha escrito nada
                </p>
                <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0, lineHeight: 1.5 }}>
                  Cuando Rut escriba sus primeros detalles<br />los verás aquí 💗
                </p>
              </motion.div>
            )}

            {/* Grouped by date */}
            {sortedDates.map((date, di) => (
              <motion.div
                key={date}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + di * 0.06 }}
                style={{ marginBottom: 20 }}
              >
                {/* Date label */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-quaternary)", textTransform: "uppercase", letterSpacing: "0.09em", margin: 0 }}>
                    {formatDate(date)}
                  </p>
                  <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.06)" }} />
                  <span style={{ fontSize: 11, color: "var(--text-quaternary)" }}>{grouped[date].length}</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {grouped[date].map((d, i) => (
                    <motion.div
                      key={d.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.04 }}
                      style={{
                        background: date === todayStr() ? "white" : "rgba(175,82,222,0.03)",
                        border: date === todayStr() ? "1px solid rgba(175,82,222,0.12)" : "1px solid rgba(175,82,222,0.07)",
                        borderRadius: 14, padding: "12px 14px",
                        display: "flex", alignItems: "flex-start", gap: 10,
                        boxShadow: date === todayStr() ? "0 2px 8px rgba(175,82,222,0.07)" : "none",
                      }}
                    >
                      <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1, opacity: date === todayStr() ? 1 : 0.6 }}>
                        {date === todayStr() ? "✨" : "✦"}
                      </span>
                      <p style={{ fontSize: 14, color: date === todayStr() ? "var(--text-primary)" : "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
                        {d.text}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </>
        )}
      </div>

      {/* Bottom Nav */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(242,242,247,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(0,0,0,0.08)",
        display: "flex", justifyContent: "space-around", alignItems: "center",
        paddingBottom: "env(safe-area-inset-bottom)", paddingTop: 8, zIndex: 100,
      }}>
        {[
          { icon: "⊞", label: "Inicio", href: `/${userParam}` },
          { icon: "💬", label: "Chat", href: `/${userParam}/chat` },
          { icon: "👤", label: "Perfil", href: `/${userParam}/profile` },
        ].map((item) => (
          <button key={item.href} onClick={() => router.push(item.href)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 20px", background: "none", border: "none", cursor: "pointer", opacity: 0.6 }}
          >
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 500, color: "var(--text-primary)" }}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

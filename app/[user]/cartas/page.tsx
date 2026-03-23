"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore, UserName } from "@/store/userStore";
import {
  saveCarta, loadCartasEnviadas, loadCartasRecibidas, markCartaRead, todayDateStr,
  type Carta,
} from "@/lib/cartas";

const ACCENT = "#FF2D55";
const ACCENT2 = "#FF9500";

function formatDate(dateStr: string): string {
  const today = todayDateStr();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (dateStr === today) return "Hoy";
  if (dateStr === yesterday) return "Ayer";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

// ─────────────────────────────────────────────────────────────────────────────

export default function CartasPage() {
  const params = useParams();
  const router = useRouter();
  const { activeUser, setUser } = useUserStore();
  const userParam = params.user as UserName;
  const isAlejandro = userParam === "alejandro";

  useEffect(() => {
    if (userParam && userParam !== activeUser) setUser(userParam, userParam);
  }, [userParam, activeUser, setUser]);

  return isAlejandro
    ? <AlejandroView userParam={userParam} router={router} />
    : <RutView userParam={userParam} router={router} />;
}

// ── ALEJANDRO VIEW ────────────────────────────────────────────────────────────

function AlejandroView({ userParam, router }: { userParam: string; router: any }) {
  const [cartas, setCartas] = useState<Carta[]>([]);
  const [loading, setLoading] = useState(true);
  const [writing, setWriting] = useState(false);
  const [text, setText] = useState("");
  const [deliverMode, setDeliverMode] = useState<"hoy" | "fecha">("hoy");
  const [deliverDate, setDeliverDate] = useState(todayDateStr());
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    loadCartasEnviadas("alejandro").then((c) => { setCartas(c); setLoading(false); });
  }, []);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    const date = deliverMode === "hoy" ? todayDateStr() : deliverDate;
    const carta = await saveCarta("alejandro", "rut", text.trim(), date);
    if (carta) {
      setCartas((prev) => [carta, ...prev]);
      // If delivering today, push immediately
      if (date === todayDateStr()) {
        await fetch("/api/push/carta", { method: "POST" });
        // Mark as notified
        await fetch("/api/cartas/mark-notified", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: carta.id }),
        });
      }
    }
    setText("");
    setDeliverMode("hoy");
    setDeliverDate(todayDateStr());
    setSending(false);
    setSent(true);
    setTimeout(() => { setSent(false); setWriting(false); }, 2000);
  };

  const today = todayDateStr();
  const pending = cartas.filter((c) => c.deliver_at > today);
  const delivered = cartas.filter((c) => c.deliver_at <= today && !c.read_at);
  const read = cartas.filter((c) => !!c.read_at);

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg-primary)", overflow: "hidden" }}>
      <Header title="Cartas 💌" subtitle={`${cartas.length} carta${cartas.length === 1 ? "" : "s"} enviada${cartas.length === 1 ? "" : "s"}`} router={router} />

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", paddingBottom: `calc(90px + env(safe-area-inset-bottom))` }}>

        {/* Write button / form */}
        <AnimatePresence mode="wait">
          {!writing && !sent ? (
            <motion.button key="btn"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setWriting(true)}
              style={{
                width: "100%", background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT2} 100%)`,
                border: "none", borderRadius: 20, padding: "18px 20px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 14, marginBottom: 24,
                boxShadow: "0 6px 24px rgba(255,45,85,0.25)",
              }}
            >
              <span style={{ fontSize: 28 }}>✉️</span>
              <div style={{ textAlign: "left" }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: "white", margin: 0 }}>Escribir una carta</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", margin: "2px 0 0" }}>Para hoy o para cualquier día que quieras</p>
              </div>
              <span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.7)", fontSize: 20 }}>›</span>
            </motion.button>
          ) : sent ? (
            <motion.div key="sent"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{
                background: "rgba(52,199,89,0.1)", border: "1px solid rgba(52,199,89,0.3)",
                borderRadius: 16, padding: "16px 20px", marginBottom: 24,
                display: "flex", alignItems: "center", gap: 12,
              }}
            >
              <motion.span animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 0.4 }} style={{ fontSize: 24 }}>💗</motion.span>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#34C759", margin: 0 }}>Carta enviada. Ella la recibirá pronto.</p>
            </motion.div>
          ) : (
            <motion.div key="form"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              style={{
                background: "white", border: "1px solid rgba(0,0,0,0.07)",
                borderRadius: 20, padding: "18px", marginBottom: 24,
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              }}
            >
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 12px" }}>✉️ Nueva carta para Rut</p>

              <textarea
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escríbele lo que quieras…"
                rows={5}
                style={{
                  width: "100%", background: "rgba(255,45,85,0.03)",
                  border: "1px solid rgba(255,45,85,0.15)", borderRadius: 12,
                  padding: "12px 14px", fontSize: 14, color: "var(--text-primary)",
                  resize: "none", outline: "none", fontFamily: "inherit",
                  lineHeight: 1.6, boxSizing: "border-box",
                }}
              />

              {/* Delivery */}
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-quaternary)", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>¿Cuándo la recibe?</p>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["hoy", "fecha"] as const).map((mode) => (
                    <button key={mode} onClick={() => setDeliverMode(mode)}
                      style={{
                        padding: "7px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                        fontSize: 12, fontWeight: 600, transition: "all 0.15s",
                        background: deliverMode === mode ? ACCENT : "rgba(0,0,0,0.06)",
                        color: deliverMode === mode ? "white" : "var(--text-secondary)",
                      }}
                    >
                      {mode === "hoy" ? "Hoy mismo" : "Elegir fecha"}
                    </button>
                  ))}
                </div>
                {deliverMode === "fecha" && (
                  <motion.input
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    type="date"
                    value={deliverDate}
                    min={todayDateStr()}
                    onChange={(e) => setDeliverDate(e.target.value)}
                    style={{
                      marginTop: 10, width: "100%", padding: "9px 12px",
                      border: "1px solid rgba(255,45,85,0.2)", borderRadius: 10,
                      fontSize: 13, color: "var(--text-primary)", background: "white",
                      outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                    }}
                  />
                )}
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button onClick={() => { setWriting(false); setText(""); }}
                  style={{ flex: 1, padding: "10px", background: "rgba(0,0,0,0.05)", border: "none", borderRadius: 12, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}
                >Cancelar</button>
                <button onClick={handleSend} disabled={!text.trim() || sending}
                  style={{
                    flex: 2, padding: "10px",
                    background: text.trim() ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` : "rgba(0,0,0,0.08)",
                    border: "none", borderRadius: 12, cursor: text.trim() ? "pointer" : "default",
                    fontSize: 13, fontWeight: 700,
                    color: text.trim() ? "white" : "var(--text-quaternary)",
                  }}
                >
                  {sending ? "Enviando…" : deliverMode === "hoy" ? "Enviar ahora 💗" : "Programar carta 📅"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sent list */}
        {loading ? (
          <p style={{ textAlign: "center", color: "var(--text-quaternary)", fontSize: 13 }}>Cargando…</p>
        ) : cartas.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--text-quaternary)", fontSize: 13, lineHeight: 1.6 }}>
            Aún no has enviado ninguna carta.<br />La primera siempre es especial 💗
          </p>
        ) : (
          <>
            {[
              { label: "📅 Programadas", items: pending, color: "#FF9500" },
              { label: "✉️ Entregadas (sin leer)", items: delivered, color: ACCENT },
              { label: "✓ Leídas", items: read, color: "#34C759" },
            ].map(({ label, items, color }) =>
              items.length > 0 && (
                <div key={label} style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-quaternary)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 8 }}>{label}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {items.map((c, i) => (
                      <motion.div key={c.id}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        style={{
                          background: "white", border: "1px solid rgba(0,0,0,0.06)",
                          borderRadius: 14, padding: "13px 16px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color, background: `${color}15`, padding: "3px 8px", borderRadius: 20 }}>
                            {c.deliver_at > todayDateStr() ? `Para el ${formatDate(c.deliver_at)}` : formatDate(c.deliver_at)}
                          </span>
                          {c.read_at && (
                            <span style={{ fontSize: 10, color: "var(--text-quaternary)" }}>
                              Leída el {formatDate(c.read_at.slice(0, 10))}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                          {c.text}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )
            )}
          </>
        )}
      </div>

      <BottomNav userParam={userParam} router={router} />
    </div>
  );
}

// ── RUT VIEW ─────────────────────────────────────────────────────────────────

function RutView({ userParam, router }: { userParam: string; router: any }) {
  const [cartas, setCartas] = useState<Carta[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    loadCartasRecibidas("rut").then((c) => { setCartas(c); setLoading(false); });
  }, []);

  const handleOpen = async (carta: Carta) => {
    setOpenId(carta.id);
    if (!carta.read_at) {
      await markCartaRead(carta.id);
      setCartas((prev) => prev.map((c) => c.id === carta.id ? { ...c, read_at: new Date().toISOString() } : c));
    }
  };

  const unread = cartas.filter((c) => !c.read_at);
  const read = cartas.filter((c) => !!c.read_at);

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg-primary)", overflow: "hidden" }}>
      <Header
        title="Cartas 💌"
        subtitle={unread.length > 0 ? `${unread.length} carta${unread.length === 1 ? "" : "s"} sin leer 💗` : "Tus cartas de Alejandro"}
        router={router}
      />

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", paddingBottom: `calc(90px + env(safe-area-inset-bottom))` }}>
        {loading ? (
          <p style={{ textAlign: "center", color: "var(--text-quaternary)", fontSize: 13, paddingTop: 40 }}>Cargando…</p>
        ) : cartas.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: "center", padding: "50px 20px" }}
          >
            <p style={{ fontSize: 36, margin: "0 0 12px" }}>💌</p>
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 6px" }}>Aún no hay cartas</p>
            <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>Cuando Alejandro te escriba aparecerán aquí</p>
          </motion.div>
        ) : (
          <>
            {/* Unread */}
            {unread.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-quaternary)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 12 }}>
                  Sin leer
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {unread.map((c, i) => (
                    <EnvelopeCard key={c.id} carta={c} isOpen={openId === c.id} onOpen={() => handleOpen(c)} delay={i * 0.08} />
                  ))}
                </div>
              </div>
            )}

            {/* Read */}
            {read.length > 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-quaternary)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 12 }}>
                  Leídas
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {read.map((c, i) => (
                    <EnvelopeCard key={c.id} carta={c} isOpen={openId === c.id} onOpen={() => setOpenId(openId === c.id ? null : c.id)} delay={i * 0.04} dimmed />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav userParam={userParam} router={router} />
    </div>
  );
}

// ── Envelope Card ─────────────────────────────────────────────────────────────

function EnvelopeCard({ carta, isOpen, onOpen, delay = 0, dimmed = false }: {
  carta: Carta; isOpen: boolean; onOpen: () => void; delay?: number; dimmed?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 280, damping: 24 }}
    >
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onOpen}
        style={{
          width: "100%", textAlign: "left", cursor: "pointer", border: "none",
          background: "none", padding: 0,
        }}
      >
        {/* Envelope closed */}
        {!isOpen && (
          <div style={{
            background: dimmed ? "rgba(255,45,85,0.03)" : "white",
            border: dimmed ? "1px solid rgba(255,45,85,0.1)" : "1px solid rgba(255,45,85,0.2)",
            borderRadius: 18,
            padding: "16px 18px",
            boxShadow: dimmed ? "none" : "0 4px 20px rgba(255,45,85,0.12)",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <motion.span
              animate={!dimmed ? { rotate: [0, -8, 8, -4, 4, 0] } : {}}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              style={{ fontSize: 28, flexShrink: 0 }}
            >
              {dimmed ? "✉️" : "💌"}
            </motion.span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: dimmed ? "var(--text-secondary)" : ACCENT, margin: "0 0 2px" }}>
                {dimmed ? "De Alejandro" : "Alejandro te escribió 💗"}
              </p>
              <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0 }}>
                {formatDate(carta.deliver_at)} · Pulsa para {dimmed ? "releer" : "abrir"}
              </p>
            </div>
            <span style={{ fontSize: 16, color: "var(--text-quaternary)" }}>›</span>
          </div>
        )}
      </motion.button>

      {/* Letter open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0.6, originY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0.6 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            style={{
              background: "linear-gradient(135deg, #fffaf9 0%, #fff5f7 100%)",
              border: "1px solid rgba(255,45,85,0.15)",
              borderRadius: 18,
              padding: "22px 20px",
              boxShadow: "0 8px 32px rgba(255,45,85,0.12)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Deco */}
            <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,45,85,0.05)" }} />

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 16 }}>💗</span>
              <p style={{ fontSize: 12, fontWeight: 700, color: ACCENT, margin: 0 }}>
                De Alejandro · {formatDate(carta.deliver_at)}
              </p>
              <button onClick={onOpen}
                style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--text-quaternary)", fontSize: 18, lineHeight: 1 }}
              >×</button>
            </div>

            <p style={{
              fontSize: 15, color: "#3a2030", lineHeight: 1.75,
              margin: 0, whiteSpace: "pre-wrap",
              fontFamily: "'Georgia', 'Times New Roman', serif",
            }}>
              {carta.text}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Shared components ─────────────────────────────────────────────────────────

function Header({ title, subtitle, router }: { title: string; subtitle: string; router: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
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
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.3px" }}>{title}</h1>
          <p style={{ fontSize: 11, color: ACCENT, margin: 0, fontWeight: 500 }}>{subtitle}</p>
        </div>
      </div>
    </motion.div>
  );
}

function BottomNav({ userParam, router }: { userParam: string; router: any }) {
  return (
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
  );
}

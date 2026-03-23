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
  const otherUser = isAlejandro ? "rut" : "alejandro";
  const otherName = isAlejandro ? "Rut" : "Alejandro";

  useEffect(() => {
    if (userParam && userParam !== activeUser) setUser(userParam, userParam);
  }, [userParam, activeUser, setUser]);

  const [tab, setTab] = useState<"recibidas" | "enviadas">("recibidas");
  const [recibidas, setRecibidas] = useState<Carta[]>([]);
  const [enviadas, setEnviadas] = useState<Carta[]>([]);
  const [loading, setLoading] = useState(true);

  // Write state
  const [writing, setWriting] = useState(false);
  const [text, setText] = useState("");
  const [deliverMode, setDeliverMode] = useState<"hoy" | "fecha">("hoy");
  const [deliverDate, setDeliverDate] = useState(todayDateStr());
  const [sending, setSending] = useState(false);
  const [justSent, setJustSent] = useState(false);

  // Open letter state
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      loadCartasRecibidas(userParam),
      loadCartasEnviadas(userParam),
    ]).then(([r, e]) => {
      setRecibidas(r);
      setEnviadas(e);
      setLoading(false);
    });
  }, [userParam]);

  const unreadCount = recibidas.filter((c) => !c.read_at).length;

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    const date = deliverMode === "hoy" ? todayDateStr() : deliverDate;
    const carta = await saveCarta(userParam, otherUser, text.trim(), date);
    if (carta) {
      setEnviadas((prev) => [carta, ...prev]);
      if (date === todayDateStr()) {
        await fetch("/api/push/carta", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toUser: otherUser }),
        });
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
    setJustSent(true);
    setWriting(false);
    setTab("enviadas");
    setTimeout(() => setJustSent(false), 3000);
  };

  const handleOpen = async (carta: Carta) => {
    const isNowOpen = openId === carta.id;
    setOpenId(isNowOpen ? null : carta.id);
    if (!isNowOpen && !carta.read_at) {
      await markCartaRead(carta.id);
      setRecibidas((prev) => prev.map((c) => c.id === carta.id ? { ...c, read_at: new Date().toISOString() } : c));
    }
  };

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg-primary)", overflow: "hidden" }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        style={{
          padding: "14px 20px 10px",
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
              Cartas 💌
            </h1>
            <p style={{ fontSize: 11, color: ACCENT, margin: 0, fontWeight: 500 }}>
              {unreadCount > 0 ? `${unreadCount} sin leer de ${otherName} 💗` : `Con ${otherName}`}
            </p>
          </div>

          {/* Write button */}
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => { setWriting(true); setTab("enviadas"); }}
            style={{
              background: `linear-gradient(135deg, ${ACCENT}, #FF9500)`,
              border: "none", borderRadius: 20, padding: "7px 14px",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              boxShadow: "0 2px 10px rgba(255,45,85,0.3)",
            }}
          >
            <span style={{ fontSize: 14 }}>✏️</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "white" }}>Escribir</span>
          </motion.button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginTop: 12, background: "rgba(0,0,0,0.05)", borderRadius: 10, padding: 3 }}>
          {([
            ["recibidas", `💌 Recibidas${unreadCount > 0 ? ` (${unreadCount})` : ""}`],
            ["enviadas", "📤 Enviadas"],
          ] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, padding: "7px 12px", borderRadius: 8, border: "none",
              fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
              background: tab === id ? "white" : "transparent",
              color: tab === id ? ACCENT : "var(--text-tertiary)",
              boxShadow: tab === id ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
            }}>{label}</button>
          ))}
        </div>
      </motion.div>

      {/* Write sheet */}
      <AnimatePresence>
        {writing && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setWriting(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200 }}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              style={{
                position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 201,
                background: "white", borderRadius: "22px 22px 0 0",
                padding: "20px 20px 32px",
                paddingBottom: `calc(32px + env(safe-area-inset-bottom))`,
                boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
              }}
            >
              {/* Handle */}
              <div style={{ width: 36, height: 4, background: "rgba(0,0,0,0.12)", borderRadius: 2, margin: "0 auto 18px" }} />

              <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 14px" }}>
                ✉️ Para {otherName}
              </p>

              <textarea
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`Escríbele lo que quieras a ${otherName}…`}
                rows={5}
                style={{
                  width: "100%", background: "rgba(255,45,85,0.03)",
                  border: "1px solid rgba(255,45,85,0.15)", borderRadius: 14,
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
                    >{mode === "hoy" ? "Hoy mismo" : "Elegir fecha"}</button>
                  ))}
                </div>
                {deliverMode === "fecha" && (
                  <motion.input
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    type="date" value={deliverDate} min={todayDateStr()}
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

              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button onClick={() => setWriting(false)}
                  style={{ flex: 1, padding: "12px", background: "rgba(0,0,0,0.06)", border: "none", borderRadius: 14, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}
                >Cancelar</button>
                <button onClick={handleSend} disabled={!text.trim() || sending}
                  style={{
                    flex: 2, padding: "12px",
                    background: text.trim() ? `linear-gradient(135deg, ${ACCENT}, #FF9500)` : "rgba(0,0,0,0.08)",
                    border: "none", borderRadius: 14,
                    cursor: text.trim() ? "pointer" : "default",
                    fontSize: 13, fontWeight: 700,
                    color: text.trim() ? "white" : "var(--text-quaternary)",
                    boxShadow: text.trim() ? "0 4px 14px rgba(255,45,85,0.25)" : "none",
                  }}
                >
                  {sending ? "Enviando…" : deliverMode === "hoy" ? "Enviar ahora 💗" : "Programar 📅"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab}
          initial={{ opacity: 0, x: tab === "recibidas" ? -16 : 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ flex: 1, overflowY: "auto", padding: "20px 16px", paddingBottom: `calc(90px + env(safe-area-inset-bottom))` }}
        >
          {/* Just sent toast */}
          <AnimatePresence>
            {justSent && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                style={{
                  background: "rgba(52,199,89,0.1)", border: "1px solid rgba(52,199,89,0.25)",
                  borderRadius: 14, padding: "12px 16px", marginBottom: 16,
                  display: "flex", alignItems: "center", gap: 10,
                }}
              >
                <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.4 }} style={{ fontSize: 20 }}>💗</motion.span>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#34C759", margin: 0 }}>
                  Carta enviada. {otherName} la recibirá pronto.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <p style={{ textAlign: "center", color: "var(--text-quaternary)", fontSize: 13, paddingTop: 40 }}>Cargando…</p>
          ) : tab === "recibidas" ? (
            <RecibidasTab cartas={recibidas} openId={openId} onOpen={handleOpen} otherName={otherName} />
          ) : (
            <EnviadasTab cartas={cartas_enviadas(enviadas)} />
          )}
        </motion.div>
      </AnimatePresence>

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

function cartas_enviadas(cartas: Carta[]) { return cartas; }

// ── RECIBIDAS TAB ─────────────────────────────────────────────────────────────

function RecibidasTab({ cartas, openId, onOpen, otherName }: {
  cartas: Carta[]; openId: string | null; onOpen: (c: Carta) => void; otherName: string;
}) {
  const unread = cartas.filter((c) => !c.read_at);
  const read = cartas.filter((c) => !!c.read_at);

  if (cartas.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{ textAlign: "center", padding: "50px 20px" }}
      >
        <p style={{ fontSize: 36, margin: "0 0 12px" }}>💌</p>
        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 6px" }}>
          Aún no hay cartas
        </p>
        <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>
          Cuando {otherName} te escriba aparecerán aquí
        </p>
      </motion.div>
    );
  }

  return (
    <>
      {unread.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <SectionLabel text="Sin leer" />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {unread.map((c, i) => (
              <EnvelopeCard key={c.id} carta={c} isOpen={openId === c.id} onOpen={() => onOpen(c)} delay={i * 0.07} />
            ))}
          </div>
        </div>
      )}
      {read.length > 0 && (
        <div>
          <SectionLabel text="Leídas" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {read.map((c, i) => (
              <EnvelopeCard key={c.id} carta={c} isOpen={openId === c.id} onOpen={() => onOpen(c)} delay={i * 0.04} dimmed />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ── ENVIADAS TAB ──────────────────────────────────────────────────────────────

function EnviadasTab({ cartas }: { cartas: Carta[] }) {
  const today = todayDateStr();
  const pending = cartas.filter((c) => c.deliver_at > today);
  const delivered = cartas.filter((c) => c.deliver_at <= today && !c.read_at);
  const read = cartas.filter((c) => !!c.read_at);

  if (cartas.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{ textAlign: "center", padding: "50px 20px" }}
      >
        <p style={{ fontSize: 36, margin: "0 0 12px" }}>📤</p>
        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 6px" }}>
          Aún no has enviado ninguna
        </p>
        <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0 }}>
          Pulsa "Escribir" para mandarle tu primera carta 💗
        </p>
      </motion.div>
    );
  }

  return (
    <>
      {[
        { label: "📅 Programadas", items: pending, color: "#FF9500" },
        { label: "✉️ Entregadas (sin leer)", items: delivered, color: ACCENT },
        { label: "✓ Leídas", items: read, color: "#34C759" },
      ].map(({ label, items, color }) =>
        items.length > 0 && (
          <div key={label} style={{ marginBottom: 24 }}>
            <SectionLabel text={label} />
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
                    <span style={{ fontSize: 11, fontWeight: 600, color, background: `${color}18`, padding: "3px 8px", borderRadius: 20 }}>
                      {c.deliver_at > today ? `Para el ${formatDate(c.deliver_at)}` : formatDate(c.deliver_at)}
                    </span>
                    {c.read_at && (
                      <span style={{ fontSize: 10, color: "var(--text-quaternary)" }}>
                        Leída el {formatDate(c.read_at.slice(0, 10))}
                      </span>
                    )}
                  </div>
                  <p style={{
                    fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5,
                    overflow: "hidden", display: "-webkit-box",
                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  }}>{c.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )
      )}
    </>
  );
}

// ── EnvelopeCard ──────────────────────────────────────────────────────────────

function EnvelopeCard({ carta, isOpen, onOpen, delay = 0, dimmed = false }: {
  carta: Carta; isOpen: boolean; onOpen: () => void; delay?: number; dimmed?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 280, damping: 24 }}
    >
      {/* Closed envelope */}
      {!isOpen && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={onOpen}
          style={{ width: "100%", textAlign: "left", cursor: "pointer", border: "none", background: "none", padding: 0 }}
        >
          <div style={{
            background: dimmed ? "rgba(255,45,85,0.02)" : "white",
            border: dimmed ? "1px solid rgba(255,45,85,0.09)" : "1px solid rgba(255,45,85,0.2)",
            borderRadius: 18, padding: "16px 18px",
            boxShadow: dimmed ? "none" : "0 4px 20px rgba(255,45,85,0.12)",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <motion.span
              animate={!dimmed ? { rotate: [0, -8, 8, -4, 4, 0] } : {}}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
              style={{ fontSize: 28, flexShrink: 0 }}
            >
              {dimmed ? "✉️" : "💌"}
            </motion.span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: dimmed ? "var(--text-secondary)" : ACCENT, margin: "0 0 2px" }}>
                {dimmed ? "Carta de antes" : "Tienes una carta 💗"}
              </p>
              <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0 }}>
                {formatDate(carta.deliver_at)} · Pulsa para {dimmed ? "releer" : "abrir"}
              </p>
            </div>
            <span style={{ fontSize: 16, color: "var(--text-quaternary)" }}>›</span>
          </div>
        </motion.button>
      )}

      {/* Open letter */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0.65, originY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0.65 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            style={{
              background: "linear-gradient(135deg, #fffaf9 0%, #fff5f7 100%)",
              border: "1px solid rgba(255,45,85,0.15)",
              borderRadius: 18, padding: "22px 20px",
              boxShadow: "0 8px 32px rgba(255,45,85,0.12)",
              position: "relative", overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,45,85,0.05)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 16 }}>💗</span>
              <p style={{ fontSize: 12, fontWeight: 700, color: ACCENT, margin: 0 }}>
                {formatDate(carta.deliver_at)}
              </p>
              <button onClick={onOpen}
                style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--text-quaternary)", fontSize: 20, lineHeight: 1 }}
              >×</button>
            </div>
            <p style={{
              fontSize: 15, color: "#3a2030", lineHeight: 1.75,
              margin: 0, whiteSpace: "pre-wrap",
              fontFamily: "'Georgia', 'Times New Roman', serif",
            }}>{carta.text}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-quaternary)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 10 }}>
      {text}
    </p>
  );
}

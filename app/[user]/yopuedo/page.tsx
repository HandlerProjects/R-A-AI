"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChatBubble } from "@/components/ChatBubble";
import { InputBar } from "@/components/InputBar";
import { useUserStore, UserName } from "@/store/userStore";
import { saveConversation, loadConversation } from "@/lib/memory";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Detalle {
  id: string;
  text: string;
  date: string; // YYYY-MM-DD
}

interface Particle {
  id: number;
  emoji: string;
  x: number;   // vw starting position
  dx: number;  // horizontal drift
  dy: number;  // vertical travel
  size: number;
  delay: number;
  rotate: number;
}

const ACCENT = "#AF52DE";
const ACCENT2 = "#FF2D55";

const TOTAL_KEY = "rut_detalles_total";
const DETALLES_KEY = "rut_detalles_list";
const SUENO_KEY = "rut_sueno";

const BURST_EMOJIS = ["💗", "✨", "🌟", "🩷", "💜", "⭐", "💫", "🌸"];

function makeParticles(): Particle[] {
  return Array.from({ length: 16 }, (_, i) => ({
    id: i,
    emoji: BURST_EMOJIS[i % BURST_EMOJIS.length],
    x: 20 + Math.random() * 60,         // spread across 20–80vw
    dx: (Math.random() - 0.5) * 120,    // ±60px horizontal drift
    dy: -(120 + Math.random() * 200),   // fly upward 120–320px
    size: 16 + Math.random() * 14,      // 16–30px
    delay: Math.random() * 0.25,        // stagger 0–250ms
    rotate: (Math.random() - 0.5) * 60,
  }));
}

const EXAMPLE_HINTS = [
  "Hoy he hecho que alguien se fuera contenta…",
  "Hoy he dado un paseo aunque fuera corto…",
  "Hoy he estado bien con alguien que quiero…",
  "Hoy me he levantado aunque tenía ganas de quedarme…",
  "Hoy he ayudado a alguien sin que me lo pidieran…",
  "Hoy me he dado cuenta de algo bonito…",
  "Hoy he terminado algo que tenía pendiente…",
  "Hoy he sonreído de verdad aunque solo fuera un momento…",
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ─────────────────────────────────────────────────────────────────────────────

export default function YoPuedoPage() {
  const params = useParams();
  const router = useRouter();
  const { activeUser, userId, setUser } = useUserStore();
  const userParam = params.user as UserName;
  const resolvedUserId = userId ?? userParam;

  useEffect(() => {
    if (userParam && userParam !== activeUser) setUser(userParam, userParam);
  }, [userParam, activeUser, setUser]);

  const [tab, setTab] = useState<"hoy" | "chat">("hoy");

  // ─── Detalles state ──────────────────────────────────────────────────────────
  const [detalles, setDetalles] = useState<Detalle[]>([]);
  const [totalDetalles, setTotalDetalles] = useState(0);
  const [inputText, setInputText] = useState("");
  const [hintIndex, setHintIndex] = useState(0);
  const [justAdded, setJustAdded] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  // ─── Sueño state ─────────────────────────────────────────────────────────────
  const [sueno, setSueno] = useState("");
  const [suenoDraft, setSuenoDraft] = useState("");
  const [editingSueno, setEditingSueno] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const savedDetalles = localStorage.getItem(DETALLES_KEY);
    if (savedDetalles) setDetalles(JSON.parse(savedDetalles));
    const savedTotal = parseInt(localStorage.getItem(TOTAL_KEY) ?? "0");
    setTotalDetalles(savedTotal);
    const savedSueno = localStorage.getItem(SUENO_KEY) ?? "";
    setSueno(savedSueno);
    setSuenoDraft(savedSueno);
  }, []);

  // Rotate hint placeholder
  useEffect(() => {
    const id = setInterval(() => {
      setHintIndex((i) => (i + 1) % EXAMPLE_HINTS.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const addDetalle = () => {
    const text = inputText.trim();
    if (!text) return;

    const newDetalle: Detalle = {
      id: Date.now().toString(),
      text,
      date: todayStr(),
    };

    const updated = [newDetalle, ...detalles].slice(0, 50); // keep last 50
    setDetalles(updated);
    localStorage.setItem(DETALLES_KEY, JSON.stringify(updated));

    const newTotal = totalDetalles + 1;
    setTotalDetalles(newTotal);
    localStorage.setItem(TOTAL_KEY, String(newTotal));

    setInputText("");
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2200);

    // Fire particle burst
    setParticles(makeParticles());
    setTimeout(() => setParticles([]), 1600);
  };

  const saveSueno = () => {
    const text = suenoDraft.trim();
    setSueno(text);
    localStorage.setItem(SUENO_KEY, text);
    setEditingSueno(false);
  };

  const todayDetalles = detalles.filter((d) => d.date === todayStr());

  // ─── Chat state ──────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [convId, setConvId] = useState<string | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!resolvedUserId) return;
    loadConversation(resolvedUserId, "yopuedo").then((conv) => {
      if (conv) {
        setMessages(conv.messages as Message[]);
        setConvId(conv.id);
      } else {
        setMessages([{
          role: "assistant",
          content: "Hola Rut 💗 Este es tu espacio. Aquí no hay que tener todo claro ni ser perfecta. Solo tienes que ser tú. ¿Cómo estás hoy?",
        }]);
      }
    });
  }, [resolvedUserId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setIsLoading(true);
    abortRef.current = new AbortController();
    let assistantText = "";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          userId: resolvedUserId,
          userName: userParam,
          module: "yopuedo",
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error();

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split("\n")) {
          if (line.startsWith("data: ") && line.slice(6).trim() !== "[DONE]") {
            try {
              const chunk = JSON.parse(line.slice(6)).text;
              if (chunk) {
                assistantText += chunk;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: "assistant", content: assistantText };
                  return updated;
                });
              }
            } catch {}
          }
        }
      }

      const finalMessages: Message[] = [...newMessages, { role: "assistant", content: assistantText }];
      if (resolvedUserId) {
        saveConversation(resolvedUserId, "yopuedo", finalMessages, convId).then(() => {
          if (!convId) loadConversation(resolvedUserId, "yopuedo").then((c) => c && setConvId(c.id));
        });
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setMessages((prev) => {
          const updated = [...prev];
          if (updated[updated.length - 1]?.role === "assistant" && !updated[updated.length - 1].content) {
            updated.pop();
          }
          return updated;
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, resolvedUserId, convId, userParam]);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg-primary)", overflow: "hidden" }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          padding: "14px 20px 10px",
          paddingTop: `calc(14px + env(safe-area-inset-top))`,
          background: "rgba(242,242,247,0.9)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.back()}
            style={{ background: "rgba(0,0,0,0.06)", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="#1C1C1E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.3px" }}>
              Yo puedo ✨
            </h1>
            <p style={{ fontSize: 11, color: ACCENT, margin: 0, fontWeight: 500 }}>
              {totalDetalles > 0
                ? `${totalDetalles} pequeño${totalDetalles === 1 ? "" : "s"} detalle${totalDetalles === 1 ? "" : "s"} guardado${totalDetalles === 1 ? "" : "s"} 💗`
                : "Tu espacio, sin prisa ni presión"}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginTop: 12, background: "rgba(0,0,0,0.05)", borderRadius: 10, padding: 3 }}>
          {([["hoy", "🌸 Hoy"], ["chat", "💬 Hablar"]] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                flex: 1, padding: "7px 12px", borderRadius: 8, border: "none",
                fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                background: tab === id ? "white" : "transparent",
                color: tab === id ? ACCENT : "var(--text-tertiary)",
                boxShadow: tab === id ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">

        {/* ── HOY TAB ─────────────────────────────────────────────────────────── */}
        {tab === "hoy" ? (
          <motion.div
            key="hoy"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.22 }}
            style={{ flex: 1, overflowY: "auto", padding: "20px 16px", paddingBottom: `calc(90px + env(safe-area-inset-bottom))` }}
          >

            {/* Add detalle section */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              style={{
                background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT2} 100%)`,
                borderRadius: 22,
                padding: "20px 18px",
                marginBottom: 18,
                boxShadow: "0 8px 28px rgba(175,82,222,0.25)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Deco circles */}
              <div style={{ position: "absolute", top: -16, right: -16, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
              <div style={{ position: "absolute", bottom: -20, left: 20, width: 50, height: 50, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />

              <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.75)", letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 8px" }}>
                Hoy, si quieres…
              </p>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.88)", margin: "0 0 14px", lineHeight: 1.45 }}>
                Escribe algo bueno que hayas hecho o sentido hoy. Por pequeño que te parezca, cuenta.
              </p>

              {/* Input */}
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={hintIndex}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: inputText ? 0 : 0.55 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.4 }}
                      style={{
                        position: "absolute",
                        top: 10, left: 12,
                        fontSize: 13,
                        color: "white",
                        margin: 0,
                        pointerEvents: "none",
                        lineHeight: 1.4,
                        zIndex: 1,
                      }}
                    >
                      {EXAMPLE_HINTS[hintIndex]}
                    </motion.p>
                  </AnimatePresence>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addDetalle(); }
                    }}
                    rows={2}
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.18)",
                      border: "1px solid rgba(255,255,255,0.3)",
                      borderRadius: 12,
                      padding: "10px 12px",
                      fontSize: 13,
                      color: "white",
                      resize: "none",
                      outline: "none",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={addDetalle}
                  disabled={!inputText.trim()}
                  style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: inputText.trim() ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.3)",
                    border: "none", cursor: inputText.trim() ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.2s",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12l7-7 7 7" stroke={inputText.trim() ? ACCENT : "rgba(255,255,255,0.6)"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.button>
              </div>
            </motion.div>

            {/* Just added celebration */}
            <AnimatePresence>
              {justAdded && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -8 }}
                  style={{
                    background: "rgba(52,199,89,0.1)",
                    border: "1px solid rgba(52,199,89,0.25)",
                    borderRadius: 12,
                    padding: "10px 14px",
                    marginBottom: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <motion.span
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.4 }}
                    style={{ fontSize: 18 }}
                  >
                    💗
                  </motion.span>
                  <p style={{ fontSize: 13, color: "#34C759", fontWeight: 500, margin: 0 }}>
                    Guardado. Eso cuenta, de verdad.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Today's detalles */}
            {todayDetalles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: 18 }}
              >
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-quaternary)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 8 }}>
                  De hoy
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {todayDetalles.map((d, i) => (
                    <motion.div
                      key={d.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      style={{
                        background: "white",
                        border: "1px solid rgba(175,82,222,0.12)",
                        borderRadius: 14,
                        padding: "12px 14px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        boxShadow: "0 2px 8px rgba(175,82,222,0.06)",
                      }}
                    >
                      <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>✨</span>
                      <p style={{ fontSize: 14, color: "var(--text-primary)", margin: 0, lineHeight: 1.4 }}>{d.text}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Older detalles (not today) */}
            {detalles.filter((d) => d.date !== todayStr()).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{ marginBottom: 18 }}
              >
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-quaternary)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 8 }}>
                  Otros días
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {detalles.filter((d) => d.date !== todayStr()).slice(0, 8).map((d, i) => (
                    <motion.div
                      key={d.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.04 }}
                      style={{
                        background: "rgba(175,82,222,0.04)",
                        border: "1px solid rgba(175,82,222,0.08)",
                        borderRadius: 14,
                        padding: "11px 14px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                      }}
                    >
                      <span style={{ fontSize: 13, color: ACCENT, opacity: 0.5, flexShrink: 0, marginTop: 2 }}>✦</span>
                      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>{d.text}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Sueño section */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                background: "white",
                border: "1px solid rgba(0,0,0,0.07)",
                borderRadius: 20,
                padding: "18px 18px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>🌙</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Mi sueño</p>
                  <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0 }}>Una cosa que quieres, sin límites</p>
                </div>
                <button
                  onClick={() => { setEditingSueno(true); setSuenoDraft(sueno); }}
                  style={{ marginLeft: "auto", background: "rgba(175,82,222,0.08)", border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600, color: ACCENT }}
                >
                  {sueno ? "Cambiar" : "Escribir"}
                </button>
              </div>

              <AnimatePresence mode="wait">
                {editingSueno ? (
                  <motion.div
                    key="edit"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <textarea
                      autoFocus
                      value={suenoDraft}
                      onChange={(e) => setSuenoDraft(e.target.value)}
                      placeholder="Un perro salchicha, una casa con mi novio, viajar a Japón sin mirar el precio…"
                      rows={3}
                      style={{
                        width: "100%",
                        background: "rgba(175,82,222,0.05)",
                        border: "1px solid rgba(175,82,222,0.2)",
                        borderRadius: 12,
                        padding: "10px 12px",
                        fontSize: 13,
                        color: "var(--text-primary)",
                        resize: "none",
                        outline: "none",
                        fontFamily: "inherit",
                        boxSizing: "border-box",
                        lineHeight: 1.4,
                      }}
                    />
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button
                        onClick={() => setEditingSueno(false)}
                        style={{ flex: 1, padding: "8px", background: "rgba(0,0,0,0.05)", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={saveSueno}
                        style={{ flex: 2, padding: "8px", background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`, border: "none", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600, color: "white" }}
                      >
                        Guardarlo 💗
                      </button>
                    </div>
                  </motion.div>
                ) : sueno ? (
                  <motion.p
                    key="show"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      fontSize: 15,
                      fontWeight: 500,
                      color: ACCENT,
                      margin: 0,
                      lineHeight: 1.5,
                      fontStyle: "italic",
                    }}
                  >
                    "{sueno}"
                  </motion.p>
                ) : (
                  <motion.p
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ fontSize: 13, color: "var(--text-quaternary)", margin: 0, fontStyle: "italic" }}
                  >
                    Sin límites de dinero ni de tiempo — ¿qué quieres?
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Empty state */}
            {detalles.length === 0 && !editingSueno && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{ textAlign: "center", padding: "20px 0 0" }}
              >
                <p style={{ fontSize: 13, color: "var(--text-quaternary)", lineHeight: 1.6 }}>
                  No hay nada que hacer aquí.<br />Solo escribir lo que quieras cuando quieras 💗
                </p>
              </motion.div>
            )}

          </motion.div>

        ) : (

          /* ── CHAT TAB ──────────────────────────────────────────────────────── */
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.22 }}
            style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
          >
            <div
              ref={scrollRef}
              style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: 2 }}
            >
              {messages.map((msg, i) => (
                <ChatBubble key={i} role={msg.role} content={msg.content} />
              ))}
              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <ChatBubble role="assistant" content="" isLoading />
              )}
            </div>
            <div style={{ paddingBottom: `env(safe-area-inset-bottom)` }}>
              <InputBar onSend={sendMessage} disabled={isLoading} placeholder="Escríbeme lo que quieras 💗" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Particle burst overlay */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, y: 0, x: 0, scale: 0.3, rotate: 0 }}
            animate={{ opacity: 0, y: p.dy, x: p.dx, scale: 1, rotate: p.rotate }}
            transition={{ duration: 1.1, delay: p.delay, ease: [0.2, 0.8, 0.4, 1] }}
            style={{
              position: "fixed",
              bottom: "30%",
              left: `${p.x}vw`,
              fontSize: p.size,
              pointerEvents: "none",
              zIndex: 999,
              userSelect: "none",
            }}
          >
            {p.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Bottom Nav */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(242,242,247,0.92)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(0,0,0,0.08)",
        display: "flex", justifyContent: "space-around", alignItems: "center",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingTop: 8, zIndex: 100,
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

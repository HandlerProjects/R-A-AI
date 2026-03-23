"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChatBubble } from "@/components/ChatBubble";
import { InputBar } from "@/components/InputBar";
import { useUserStore, UserName } from "@/store/userStore";
import { saveConversation, loadConversation } from "@/lib/memory";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Goal {
  id: string;
  text: string;
  emoji: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = "#AF52DE";
const ACCENT2 = "#FF2D55";

const DAILY_GOALS: Goal[] = [
  { id: "g1", emoji: "📝", text: "Escribe 3 cosas buenas que pasaron hoy" },
  { id: "g2", emoji: "💪", text: "Haz algo pequeño que normalmente evitas" },
  { id: "g3", emoji: "🌸", text: "Dedica 10 minutos solo para ti" },
  { id: "g4", emoji: "✨", text: "Di una cosa positiva de ti misma" },
  { id: "g5", emoji: "💧", text: "Bebe agua y mueve el cuerpo aunque sea un poco" },
];

const AFFIRMATIONS = [
  "Eres más capaz de lo que crees 💗",
  "Cada pequeño paso cuenta más de lo que parece ✨",
  "No tienes que ser perfecta — solo seguir adelante 🌸",
  "Lo que sientes es válido, y puedes con esto 💜",
  "Hoy es un buen día para creer en ti 🌟",
  "Tus logros son reales aunque no los veas siempre 💗",
  "La persona que más te necesita eres tú misma ✨",
];

const GOALS_KEY = "rut_goals_"; // + date YYYY-MM-DD
const STREAK_KEY = "rut_streak";
const TOTAL_KEY = "rut_total_goals";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Component ────────────────────────────────────────────────────────────────

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

  // ─── Daily goals state ──────────────────────────────────────────────────────
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [streak, setStreak] = useState(0);
  const [totalGoals, setTotalGoals] = useState(0);
  const [allDone, setAllDone] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  // Load goals from localStorage
  useEffect(() => {
    const key = GOALS_KEY + todayStr();
    const saved = localStorage.getItem(key);
    if (saved) setCompleted(new Set(JSON.parse(saved)));

    const s = parseInt(localStorage.getItem(STREAK_KEY) ?? "0");
    setStreak(s);
    const t = parseInt(localStorage.getItem(TOTAL_KEY) ?? "0");
    setTotalGoals(t);
  }, []);

  // Watch for all done
  useEffect(() => {
    if (completed.size === DAILY_GOALS.length && DAILY_GOALS.length > 0) {
      setAllDone(true);
      setCelebrating(true);
      setTimeout(() => setCelebrating(false), 3000);
    } else {
      setAllDone(false);
    }
  }, [completed]);

  const toggleGoal = (id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        // Track total
        const t = parseInt(localStorage.getItem(TOTAL_KEY) ?? "0") + 1;
        localStorage.setItem(TOTAL_KEY, String(t));
        setTotalGoals(t);
      }
      localStorage.setItem(GOALS_KEY + todayStr(), JSON.stringify([...next]));
      return next;
    });
  };

  // Update streak when allDone
  useEffect(() => {
    if (allDone) {
      const lastDone = localStorage.getItem("rut_last_done");
      const today = todayStr();
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (lastDone !== today) {
        const currentStreak = parseInt(localStorage.getItem(STREAK_KEY) ?? "0");
        const newStreak = lastDone === yesterday ? currentStreak + 1 : 1;
        localStorage.setItem(STREAK_KEY, String(newStreak));
        localStorage.setItem("rut_last_done", today);
        setStreak(newStreak);
      }
    }
  }, [allDone]);

  // ─── Chat state ─────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [convId, setConvId] = useState<string | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load conversation
  useEffect(() => {
    if (!resolvedUserId) return;
    loadConversation(resolvedUserId, "yopuedo").then((conv) => {
      if (conv) {
        setMessages(conv.messages as Message[]);
        setConvId(conv.id);
      } else {
        // Welcome message
        setMessages([{
          role: "assistant",
          content: "Hola Rut 💗 Este es tu espacio. Aquí no hay que ser perfecta ni tener todo claro. Solo tienes que ser tú. ¿Cómo estás hoy?",
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

      if (!res.ok || !res.body) throw new Error("Error");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split("\n")) {
          if (line.startsWith("data: ") && line.slice(6).trim() !== "[DONE]") {
            try {
              const text = JSON.parse(line.slice(6)).text;
              if (text) {
                assistantText += text;
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
  }, [messages, isLoading, resolvedUserId, convId]);

  const todayAffirmation = AFFIRMATIONS[new Date().getDay() % AFFIRMATIONS.length];

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
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.3px" }}>
              Yo puedo ✨
            </h1>
            <p style={{ fontSize: 11, color: ACCENT, margin: 0, fontWeight: 500 }}>Tu espacio para crecer cada día</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginTop: 12, background: "rgba(0,0,0,0.05)", borderRadius: 10, padding: 3 }}>
          {([["hoy", "📅 Mis metas"], ["chat", "💬 Mi apoyo"]] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                flex: 1,
                padding: "7px 12px",
                borderRadius: 8,
                border: "none",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
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
        {tab === "hoy" ? (
          <motion.div
            key="hoy"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
            style={{ flex: 1, overflowY: "auto", padding: "20px 16px", paddingBottom: `calc(84px + env(safe-area-inset-bottom))` }}
          >
            {/* Affirmation card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT2} 100%)`,
                borderRadius: 20,
                padding: "20px 22px",
                marginBottom: 20,
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 8px 32px rgba(175,82,222,0.28)",
              }}
            >
              {/* Decorative circles */}
              <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
              <div style={{ position: "absolute", bottom: -30, right: 30, width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
              <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 6px" }}>
                Frase del día
              </p>
              <p style={{ fontSize: 17, fontWeight: 600, color: "white", margin: 0, lineHeight: 1.4 }}>
                {todayAffirmation}
              </p>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              style={{ display: "flex", gap: 10, marginBottom: 20 }}
            >
              <StatCard emoji="🔥" value={streak} label={streak === 1 ? "día seguido" : "días seguidos"} color="#FF9500" />
              <StatCard emoji="⭐" value={totalGoals} label="logros totales" color="#FFD700" />
              <StatCard emoji="✅" value={completed.size} label={`de ${DAILY_GOALS.length} hoy`} color="#34C759" />
            </motion.div>

            {/* Goals section */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-quaternary)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 10 }}>
                Metas de hoy
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {DAILY_GOALS.map((goal, i) => {
                  const done = completed.has(goal.id);
                  return (
                    <motion.button
                      key={goal.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + i * 0.06, type: "spring", stiffness: 300, damping: 24 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => toggleGoal(goal.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        background: done
                          ? `linear-gradient(135deg, rgba(175,82,222,0.08) 0%, rgba(255,45,85,0.06) 100%)`
                          : "white",
                        border: done
                          ? `1px solid rgba(175,82,222,0.2)`
                          : "1px solid rgba(0,0,0,0.06)",
                        borderRadius: 16,
                        padding: "14px 16px",
                        cursor: "pointer",
                        textAlign: "left",
                        boxShadow: done ? "0 2px 12px rgba(175,82,222,0.1)" : "0 2px 8px rgba(0,0,0,0.05)",
                        transition: "all 0.25s",
                      }}
                    >
                      {/* Checkbox */}
                      <motion.div
                        animate={done ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                        transition={{ duration: 0.3 }}
                        style={{
                          width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                          background: done ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` : "rgba(0,0,0,0.05)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          boxShadow: done ? "0 2px 8px rgba(175,82,222,0.35)" : "none",
                        }}
                      >
                        {done && (
                          <motion.svg
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            width="14" height="14" viewBox="0 0 24 24" fill="none"
                          >
                            <motion.path
                              d="M5 12l5 5L20 7"
                              stroke="white"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 0.3 }}
                            />
                          </motion.svg>
                        )}
                      </motion.div>

                      <span style={{ fontSize: 20, flexShrink: 0 }}>{goal.emoji}</span>

                      <p style={{
                        fontSize: 14, fontWeight: 500,
                        color: done ? ACCENT : "var(--text-primary)",
                        margin: 0, lineHeight: 1.35,
                        textDecoration: done ? "line-through" : "none",
                        opacity: done ? 0.7 : 1,
                        transition: "all 0.25s",
                      }}>
                        {goal.text}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* All done celebration */}
            <AnimatePresence>
              {allDone && (
                <motion.div
                  initial={{ opacity: 0, y: 16, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  style={{
                    marginTop: 20,
                    background: "linear-gradient(135deg, rgba(52,199,89,0.12) 0%, rgba(175,82,222,0.1) 100%)",
                    border: "1px solid rgba(52,199,89,0.25)",
                    borderRadius: 16,
                    padding: "18px 20px",
                    textAlign: "center",
                  }}
                >
                  {celebrating && (
                    <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 8 }}>
                      {["🌟", "💗", "✨", "💜", "🌟"].map((h, i) => (
                        <motion.span
                          key={i}
                          animate={{ y: [0, -8, 0], scale: [1, 1.3, 1] }}
                          transition={{ duration: 0.6, delay: i * 0.1, repeat: 2 }}
                          style={{ fontSize: 18 }}
                        >
                          {h}
                        </motion.span>
                      ))}
                    </div>
                  )}
                  <p style={{ fontSize: 16, fontWeight: 700, color: "#34C759", margin: "0 0 4px" }}>
                    ¡Lo has conseguido! 🎉
                  </p>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
                    Has completado todas las metas de hoy. Eso es lo que la hace especial 💗
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA to chat */}
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setTab("chat")}
              style={{
                marginTop: 20,
                width: "100%",
                background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT2} 100%)`,
                border: "none",
                borderRadius: 16,
                padding: "14px 20px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 4px 16px rgba(175,82,222,0.25)",
              }}
            >
              <span style={{ fontSize: 18 }}>💬</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "white" }}>
                Cuéntame cómo estás
              </span>
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.25 }}
            style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
          >
            {/* Messages */}
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

            {/* Input */}
            <div style={{ paddingBottom: `env(safe-area-inset-bottom)` }}>
              <InputBar onSend={sendMessage} disabled={isLoading} placeholder="Escríbeme lo que quieras 💗" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom nav */}
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ emoji, value, label, color }: { emoji: string; value: number; label: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        flex: 1,
        background: "white",
        border: "1px solid rgba(0,0,0,0.06)",
        borderRadius: 14,
        padding: "12px 10px",
        textAlign: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      <span style={{ fontSize: 18 }}>{emoji}</span>
      <p style={{ fontSize: 20, fontWeight: 800, color, margin: "2px 0 0", lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 10, color: "var(--text-tertiary)", margin: "2px 0 0", lineHeight: 1.3 }}>{label}</p>
    </motion.div>
  );
}

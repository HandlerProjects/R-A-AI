"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChatBubble } from "@/components/ChatBubble";
import { InputBar } from "@/components/InputBar";
import { useUserStore, UserName } from "@/store/userStore";
import { saveConversation, loadConversation } from "@/lib/memory";

const MODES = [
  { id: "tfg_busqueda",   icon: "🔍", label: "Búsqueda",   desc: "Encontrar fuentes y artículos" },
  { id: "tfg_redaccion",  icon: "✍️", label: "Redacción",  desc: "Estructurar y escribir secciones" },
  { id: "tfg_documentos", icon: "📄", label: "Documentos", desc: "Analizar textos y evitar plagio" },
  { id: "tfg_mejorar",    icon: "✏️", label: "Mejorar",    desc: "Revisar y pulir lo que ya tienes" },
] as const;

type ModeId = typeof MODES[number]["id"];

const TOPIC_KEY = "rut_tfg_topic";
const ACCENT = "#FF2D55";

interface Message {
  role: "user" | "assistant";
  content: string;
}

type ModeMessages = Record<ModeId, Message[]>;
type ModeConvIds = Record<ModeId, string | undefined>;

const emptyModeMessages = (): ModeMessages => ({
  tfg_busqueda: [],
  tfg_redaccion: [],
  tfg_documentos: [],
  tfg_mejorar: [],
});

const emptyConvIds = (): ModeConvIds => ({
  tfg_busqueda: undefined,
  tfg_redaccion: undefined,
  tfg_documentos: undefined,
  tfg_mejorar: undefined,
});

export default function TFGPage() {
  const params = useParams();
  const router = useRouter();
  const { activeUser, userId, setUser } = useUserStore();
  const userParam = params.user as UserName;

  const [topic, setTopic] = useState<string | null>(null);
  const [topicInput, setTopicInput] = useState("");
  const [activeMode, setActiveMode] = useState<ModeId>("tfg_busqueda");
  const [modeMessages, setModeMessages] = useState<ModeMessages>(emptyModeMessages());
  const [convIds, setConvIds] = useState<ModeConvIds>(emptyConvIds());
  const [isLoading, setIsLoading] = useState(false);
  const [loadedModes, setLoadedModes] = useState<Set<ModeId>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load topic from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(TOPIC_KEY);
    if (stored) setTopic(stored);
  }, []);

  useEffect(() => {
    if (userParam && userParam !== activeUser) setUser(userParam, userParam);
  }, [userParam, activeUser, setUser]);

  // Load conversation history for active mode when topic is set
  useEffect(() => {
    if (!topic || loadedModes.has(activeMode)) return;
    const resolvedUserId = userId ?? userParam;
    loadConversation(resolvedUserId, activeMode)
      .then((conv) => {
        if (conv && conv.messages.length > 0) {
          setModeMessages((prev) => ({ ...prev, [activeMode]: conv.messages as Message[] }));
          setConvIds((prev) => ({ ...prev, [activeMode]: conv.id }));
        }
        setLoadedModes((prev) => new Set([...prev, activeMode]));
      })
      .catch(() => {
        setLoadedModes((prev) => new Set([...prev, activeMode]));
      });
  }, [activeMode, topic, userId, userParam, loadedModes]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [modeMessages, activeMode, isLoading]);

  const handleSetTopic = () => {
    const t = topicInput.trim();
    if (!t) return;
    localStorage.setItem(TOPIC_KEY, t);
    setTopic(t);
  };

  const handleChangeTopic = () => {
    localStorage.removeItem(TOPIC_KEY);
    setTopic(null);
    setTopicInput("");
    setModeMessages(emptyModeMessages());
    setConvIds(emptyConvIds());
    setLoadedModes(new Set());
  };

  const handleClearMode = () => {
    setModeMessages((prev) => ({ ...prev, [activeMode]: [] }));
    setConvIds((prev) => ({ ...prev, [activeMode]: undefined }));
  };

  const currentMessages = modeMessages[activeMode];

  const sendMessage = useCallback(
    async (content: string) => {
      if (isLoading) return;
      const resolvedUserId = userId ?? userParam;
      const userMessage: Message = { role: "user", content };
      const updatedMessages = [...currentMessages, userMessage];

      setModeMessages((prev) => ({ ...prev, [activeMode]: updatedMessages }));
      setIsLoading(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages,
            userId: resolvedUserId,
            userName: userParam,
            module: activeMode,
            tfgTopic: topic,
          }),
        });

        if (!response.ok || !response.body) throw new Error();

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = "";

        setModeMessages((prev) => ({
          ...prev,
          [activeMode]: [...updatedMessages, { role: "assistant", content: "" }],
        }));
        setIsLoading(false);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of decoder.decode(value).split("\n")) {
            if (line.startsWith("data: ") && line.slice(6) !== "[DONE]") {
              try {
                const chunk = JSON.parse(line.slice(6)).text;
                if (chunk) {
                  assistantContent += chunk;
                  setModeMessages((prev) => {
                    const msgs = [...prev[activeMode]];
                    msgs[msgs.length - 1] = { role: "assistant", content: assistantContent };
                    return { ...prev, [activeMode]: msgs };
                  });
                }
              } catch {}
            }
          }
        }

        try {
          const savedId = await saveConversation(
            resolvedUserId,
            activeMode,
            [...updatedMessages, { role: "assistant", content: assistantContent }],
            convIds[activeMode]
          );
          if (!convIds[activeMode] && savedId) {
            setConvIds((prev) => ({ ...prev, [activeMode]: savedId }));
          }
        } catch {}
      } catch {
        setIsLoading(false);
        setModeMessages((prev) => ({
          ...prev,
          [activeMode]: [
            ...updatedMessages,
            { role: "assistant", content: "Lo siento, hubo un error. Inténtalo de nuevo." },
          ],
        }));
      }
    },
    [isLoading, currentMessages, userId, userParam, activeMode, topic, convIds]
  );

  // ── ONBOARDING PHASE ─────────────────────────────────────────
  if (!topic) {
    return (
      <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 16px",
          paddingTop: `calc(12px + env(safe-area-inset-top))`,
          background: "rgba(242,242,247,0.92)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,0,0,0.07)",
          flexShrink: 0,
        }}>
          <button
            onClick={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.06)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 5l-7 7 7 7" stroke="#1C1C1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>🎓</span>
              <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>TFG Psicología</span>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>R&A · Rut</p>
          </div>
        </div>

        {/* AI opening message */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "20px 14px 0" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 280, damping: 24 }}
          >
            <ChatBubble
              role="assistant"
              content={`¡Hola Rut! 🎓\n\nEste es tu espacio para el TFG. Cuéntame, **¿cuál es el tema que has elegido?**\n\nEn cuanto me lo digas tengo todo listo — búsqueda de información, redacción, análisis de documentos y revisiones.`}
              accentColor={ACCENT}
            />
          </motion.div>
        </div>

        {/* Topic input */}
        <div style={{
          padding: "10px 16px",
          paddingBottom: `calc(10px + env(safe-area-inset-bottom))`,
          background: "rgba(242,242,247,0.95)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(0,0,0,0.08)",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "white",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 24,
            padding: "8px 8px 8px 14px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}>
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSetTopic(); }}
              placeholder="El tema de mi TFG es..."
              autoFocus
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                color: "var(--text-primary)", fontSize: 15, lineHeight: 1.5, fontFamily: "inherit",
              }}
            />
            <AnimatePresence>
              {topicInput.trim() && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  onClick={handleSetTopic}
                  style={{
                    width: 34, height: 34, borderRadius: "50%",
                    background: ACCENT, border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN PHASE ───────────────────────────────────────────────
  const currentMode = MODES.find((m) => m.id === activeMode)!;

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg-primary)", overflow: "hidden" }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 16px",
          paddingTop: `calc(12px + env(safe-area-inset-top))`,
          background: "rgba(242,242,247,0.92)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,0,0,0.07)",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.06)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="#1C1C1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 18 }}>🎓</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {topic}
            </span>
          </div>
          <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0 }}>TFG Psicología · Rut</p>
        </div>

        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {currentMessages.length > 0 && (
            <button
              onClick={handleClearMode}
              style={{ padding: "5px 10px", borderRadius: 16, background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.06)", color: "var(--text-tertiary)", fontSize: 11, cursor: "pointer" }}
            >
              Limpiar
            </button>
          )}
          <button
            onClick={handleChangeTopic}
            style={{ padding: "5px 10px", borderRadius: 16, background: "rgba(255,45,85,0.08)", border: "1px solid rgba(255,45,85,0.15)", color: ACCENT, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
          >
            Cambiar tema
          </button>
        </div>
      </motion.div>

      {/* Mode tabs */}
      <div style={{
        display: "flex", gap: 6,
        padding: "10px 14px",
        overflowX: "auto",
        background: "rgba(242,242,247,0.7)",
        borderBottom: "1px solid rgba(0,0,0,0.05)",
        flexShrink: 0,
        scrollbarWidth: "none",
      }}>
        {MODES.map((mode) => (
          <motion.button
            key={mode.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveMode(mode.id)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px",
              borderRadius: 20,
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
              fontSize: 13,
              fontWeight: activeMode === mode.id ? 700 : 500,
              background: activeMode === mode.id ? ACCENT : "rgba(0,0,0,0.06)",
              color: activeMode === mode.id ? "white" : "var(--text-secondary)",
              transition: "all 0.2s ease",
              boxShadow: activeMode === mode.id ? `0 3px 12px ${ACCENT}40` : "none",
            }}
          >
            <span style={{ fontSize: 15 }}>{mode.icon}</span>
            {mode.label}
          </motion.button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 4, background: "var(--bg-primary)" }}>

        {currentMessages.length === 0 && !isLoading && (
          <motion.div
            key={activeMode}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, paddingBottom: 40 }}
          >
            <div style={{ width: 64, height: 64, borderRadius: 20, background: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
              {currentMode.icon}
            </div>
            <p style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{currentMode.label}</p>
            <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0, textAlign: "center", maxWidth: 220, lineHeight: 1.5 }}>{currentMode.desc}</p>
          </motion.div>
        )}

        {currentMessages.map((msg, i) => (
          <ChatBubble key={i} role={msg.role} content={msg.content} accentColor={ACCENT} />
        ))}

        {isLoading && <ChatBubble role="assistant" content="" isLoading accentColor={ACCENT} />}
        <div ref={messagesEndRef} />
      </div>

      <InputBar
        onSend={sendMessage}
        disabled={isLoading}
        placeholder={`${currentMode.icon} ${currentMode.label}...`}
        accentColor={ACCENT}
      />
    </div>
  );
}

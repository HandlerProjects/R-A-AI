"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChatBubble } from "@/components/ChatBubble";
import { useUserStore, UserName } from "@/store/userStore";
import { useChatStream } from "@/hooks/useChatStream";

// ─── Shared helpers ───────────────────────────────────────────────────────────

function ChipGroup({ options, selected, onSelect, accentColor }: {
  options: string[];
  selected: string | null;
  onSelect: (v: string) => void;
  accentColor: string;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((opt) => {
        const isSelected = selected === opt;
        return (
          <motion.button
            key={opt}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(opt)}
            style={{
              padding: "8px 16px", borderRadius: 20, border: "none", cursor: "pointer",
              background: isSelected ? accentColor : "white",
              color: isSelected ? "white" : "var(--text-secondary)",
              fontSize: 13, fontWeight: isSelected ? 600 : 400,
              boxShadow: isSelected ? `0 2px 10px ${accentColor}30` : "0 1px 4px rgba(0,0,0,0.07)",
              transition: "all 0.15s ease",
            }}
          >
            {opt}
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MODES = [
  { id: "conversacion", icon: "🗣️", title: "Conversación", desc: "Practica hablando y respondiendo" },
  { id: "vocabulario", icon: "📖", title: "Vocabulario", desc: "Aprende y repasa palabras nuevas" },
  { id: "pronunciacion", icon: "🎵", title: "Pronunciación", desc: "Acentos, sílabas y sonidos" },
  { id: "cotidiano", icon: "☕", title: "Vida cotidiana", desc: "Cómo hablan los italianos de verdad" },
  { id: "situaciones", icon: "🎭", title: "Situaciones", desc: "Restaurante, tiendas, trabajo..." },
  { id: "escritura", icon: "✍️", title: "Escritura", desc: "Gramática, redacción y estilo" },
];

const LEVELS = ["Principiante", "A2", "B1", "B2", "Avanzado"];

const MODE_INSTRUCTIONS: Record<string, string> = {
  conversacion: "Empecemos a conversar. Inicia tú con una pregunta o situación simple. Corrige mis errores con tacto.",
  vocabulario: "Dame 10 palabras esenciales relacionadas con un tema cotidiano. Luego ponme a prueba.",
  pronunciacion: "Explícame las reglas de pronunciación más importantes del italiano. Empieza por las vocales y los sonidos que no existen en español.",
  cotidiano: "¿Cómo hablan los italianos en su vida diaria? Dame expresiones reales, jerga y frases hechas que no salen en los libros.",
  situaciones: "Vamos a practicar una situación real. Tú serás el camarero/dependiente y yo el cliente. Empieza la escena.",
  escritura: "Explícame la estructura básica de una frase en italiano y las principales diferencias con el español.",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ItalianPage() {
  const params = useParams();
  const router = useRouter();
  const { userId, setUser } = useUserStore();

  const userParam = params.user as UserName;
  const isAlejandro = userParam === "alejandro";
  const accentColor = isAlejandro ? "#1C1C1E" : "#FF2D55";
  const resolvedUserId = userId ?? userParam;

  useEffect(() => {
    if (userParam) setUser(userParam, userParam);
  }, [userParam, setUser]);

  const [phase, setPhase] = useState<"selector" | "chat">("selector");
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [oralMode, setOralMode] = useState(false);
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const [isRecording, setIsRecording, ] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  const { messages, isLoading, send } = useChatStream({
    userId: resolvedUserId,
    userName: userParam,
    module: "italian",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setSpeechAvailable(!!SpeechRecognitionAPI);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleStart = async () => {
    if (!selectedMode || !selectedLevel) return;
    const modeTitle = MODES.find((m) => m.id === selectedMode)?.title ?? selectedMode;
    const instruction = MODE_INSTRUCTIONS[selectedMode] ?? "";
    const prompt = `[MODO SELECCIONADO: ${modeTitle}] [NIVEL: ${selectedLevel}]\n${instruction}`;
    setPhase("chat");
    await send(prompt);
  };

  const speakText = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "it-IT";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }, []);

  const startRecording = useCallback(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "it-IT";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript.trim()) send(transcript.trim());
    };
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [send]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }, []);

  const handleSendText = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;
    send(trimmed);
    setInputValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendText(); }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  // ── Selector phase ────────────────────────────────────────────────────────

  if (phase === "selector") {
    const canStart = !!(selectedMode && selectedLevel);

    return (
      <div style={{ height: "100dvh", overflow: "hidden", display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>
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
            flexShrink: 0, zIndex: 10,
          }}
        >
          <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.06)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 5l-7 7 7 7" stroke="#1C1C1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>🇮🇹</span>
              <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>Italiano</span>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>R&A · {isAlejandro ? "Alejandro" : "Rut"}</p>
          </div>
        </motion.div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 24px" }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Mode grid */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14, marginTop: 0 }}>
                ¿Qué practicamos?
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {MODES.map((mode) => {
                  const isSelected = selectedMode === mode.id;
                  return (
                    <motion.button
                      key={mode.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedMode(isSelected ? null : mode.id)}
                      style={{
                        padding: "16px 14px", borderRadius: 18, textAlign: "left",
                        border: isSelected ? `2px solid ${accentColor}` : "2px solid rgba(0,0,0,0.06)",
                        background: "white", cursor: "pointer",
                        boxShadow: isSelected ? `0 4px 16px ${accentColor}25` : "0 2px 8px rgba(0,0,0,0.06)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div style={{ fontSize: 26, marginBottom: 8 }}>{mode.icon}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{mode.title}</div>
                      <div style={{ fontSize: 12, color: "var(--text-tertiary)", lineHeight: 1.4 }}>{mode.desc}</div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Level chips */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12, marginTop: 0 }}>
                Nivel
              </p>
              <ChipGroup options={LEVELS} selected={selectedLevel} onSelect={(v) => setSelectedLevel(selectedLevel === v ? null : v)} accentColor={accentColor} />
            </div>

            {/* Oral mode toggle */}
            {speechAvailable && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", borderRadius: 14, padding: "14px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <span style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 500 }}>🎤 Modo oral — habla en italiano</span>
                <button
                  onClick={() => setOralMode((v) => !v)}
                  style={{
                    width: 50, height: 28, borderRadius: 14, border: "none", cursor: "pointer",
                    background: oralMode ? accentColor : "rgba(0,0,0,0.15)",
                    position: "relative", transition: "background 0.2s ease", flexShrink: 0,
                  }}
                >
                  <motion.div
                    animate={{ x: oralMode ? 22 : 2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    style={{ width: 24, height: 24, borderRadius: "50%", background: "white", position: "absolute", top: 2, boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}
                  />
                </button>
              </div>
            )}

            {/* Start button */}
            <motion.button
              whileTap={canStart ? { scale: 0.97 } : {}}
              onClick={handleStart}
              style={{
                width: "100%", padding: "16px 0", borderRadius: 16, border: "none",
                background: canStart ? accentColor : "rgba(0,0,0,0.08)",
                color: canStart ? "white" : "var(--text-quaternary)",
                fontSize: 16, fontWeight: 700,
                cursor: canStart ? "pointer" : "not-allowed",
                boxShadow: canStart ? `0 4px 20px ${accentColor}40` : "none",
                transition: "all 0.2s ease",
              }}
            >
              Iniziamo! 🇮🇹
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Chat phase ──────────────────────────────────────────────────────────────

  return (
    <div style={{ height: "100dvh", overflow: "hidden", display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>
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
          flexShrink: 0, zIndex: 10,
        }}
      >
        <button onClick={() => setPhase("selector")} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.06)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="#1C1C1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>🇮🇹</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>Italiano</span>
            {selectedMode && (
              <span style={{ fontSize: 12, color: "var(--text-tertiary)", background: "rgba(0,0,0,0.06)", padding: "2px 8px", borderRadius: 10 }}>
                {MODES.find((m) => m.id === selectedMode)?.icon} {selectedLevel}
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>R&A · {isAlejandro ? "Alejandro" : "Rut"}</p>
        </div>
      </motion.div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ position: "relative" }}>
            <ChatBubble role={msg.role} content={msg.content} accentColor={accentColor} />
            {/* TTS button for assistant messages */}
            {msg.role === "assistant" && msg.content && (
              <div style={{ display: "flex", justifyContent: "flex-start", marginTop: -2, marginBottom: 6, paddingLeft: 4 }}>
                <button
                  onClick={() => speakText(msg.content)}
                  style={{
                    padding: "3px 10px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)",
                    background: "white", cursor: "pointer", fontSize: 11,
                    color: "var(--text-tertiary)", fontWeight: 500,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                  }}
                >
                  🔊
                </button>
              </div>
            )}
          </div>
        ))}
        {isLoading && <ChatBubble role="assistant" content="" isLoading accentColor={accentColor} />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div style={{
        padding: "10px 16px",
        paddingBottom: `calc(10px + env(safe-area-inset-bottom))`,
        background: "rgba(242,242,247,0.95)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(0,0,0,0.08)",
        display: "flex", gap: 8, alignItems: "flex-end",
      }}>
        {/* Mic button when oral mode on */}
        {oralMode && speechAvailable && (
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={isRecording ? stopRecording : startRecording}
            style={{
              width: 46, height: 46, borderRadius: "50%", border: "none",
              background: isRecording ? "#FF3B30" : accentColor,
              cursor: "pointer", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: isRecording ? "0 0 0 6px rgba(255,59,48,0.2)" : `0 4px 16px ${accentColor}40`,
              transition: "background 0.2s ease",
            }}
          >
            {isRecording ? (
              // Pulsing waveform
              <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ scaleY: [0.4, 1.2, 0.4] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                    style={{ width: 3, height: 16, borderRadius: 2, background: "white" }}
                  />
                ))}
              </div>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="white"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </motion.button>
        )}

        {/* Text input */}
        <div style={{
          flex: 1, display: "flex", alignItems: "flex-end", gap: 8,
          background: "white", border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 24, padding: "8px 8px 8px 14px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}>
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={oralMode && speechAvailable ? "O escribe aquí..." : "Scrivi in italiano..."}
            disabled={isLoading}
            rows={1}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: "var(--text-primary)", fontSize: 15, lineHeight: 1.5,
              resize: "none", fontFamily: "inherit", maxHeight: 120, padding: 0,
              opacity: isLoading ? 0.5 : 1,
            }}
          />
          <AnimatePresence>
            {inputValue.trim() && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                onClick={handleSendText}
                disabled={isLoading}
                style={{
                  width: 34, height: 34, borderRadius: "50%", background: accentColor,
                  border: "none", cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
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

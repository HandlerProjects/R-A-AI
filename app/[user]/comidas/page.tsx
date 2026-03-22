"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChatBubble } from "@/components/ChatBubble";
import { InputBar } from "@/components/InputBar";
import { useUserStore, UserName } from "@/store/userStore";
import { useChatStream } from "@/hooks/useChatStream";

// ─── Shared helpers ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10, marginTop: 0 }}>
      {children}
    </p>
  );
}

function ChipGroup({ options, selected, onSelect, accentColor, multiSelect }: {
  options: string[];
  selected: string | string[] | null;
  onSelect: (v: string) => void;
  accentColor: string;
  multiSelect?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((opt) => {
        const isSelected = multiSelect
          ? (selected as string[] ?? []).includes(opt)
          : selected === opt;
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

const STEP_LABELS = ["¿Qué modo?", "⏱ Tiempo de preparación", "🔧 Elaboración", "🥕 Ingredientes que tienes", "🚫 Restricciones"];

const MODOS = ["🥗 Dieta", "🍕 Normal", "🔥 Antojo", "🌱 Vegetariano", "💪 Proteico", "👨‍🍳 Chef mode"];
const TIEMPOS = ["⚡ < 15 min", "🕐 15-30 min", "🕑 30-60 min", "🍳 + 1 hora"];
const ELABORACIONES = ["Fácil", "Media", "Elaborada"];
const RESTRICCIONES = ["Sin gluten", "Sin lactosa", "Sin mariscos", "Sin cerdo", "Sin frutos secos", "Ninguna"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ComidasPage() {
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

  const [phase, setPhase] = useState<"wizard" | "chat">("wizard");
  const [step, setStep] = useState(0);
  const [modo, setModo] = useState<string | null>(null);
  const [tiempo, setTiempo] = useState<string | null>(null);
  const [elaboracion, setElaboracion] = useState<string | null>(null);
  const [ingredientes, setIngredientes] = useState("");
  const [restricciones, setRestricciones] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, send } = useChatStream({
    userId: resolvedUserId,
    userName: userParam,
    module: "comidas",
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const toggleRestriccion = (v: string) => {
    setRestricciones((prev) => {
      if (v === "Ninguna") return ["Ninguna"];
      const withoutNinguna = prev.filter((r) => r !== "Ninguna");
      return withoutNinguna.includes(v) ? withoutNinguna.filter((r) => r !== v) : [...withoutNinguna, v];
    });
  };

  const handleNext = (value: string | null, setter: (v: string) => void) => {
    if (!value) return;
    setter(value);
    setStep((s) => s + 1);
  };

  const handleGenerate = async () => {
    const lines = [
      "Necesito una receta con estos parámetros:",
      `- Modo: ${modo}`,
      `- Tiempo: ${tiempo}`,
      `- Elaboración: ${elaboracion}`,
    ];
    if (ingredientes.trim()) lines.push(`- Ingredientes disponibles: ${ingredientes.trim()}`);
    const activeRestricciones = restricciones.filter((r) => r !== "Ninguna");
    if (activeRestricciones.length > 0) lines.push(`- Restricciones: ${activeRestricciones.join(", ")}`);
    lines.push("Sé concreto: nombre del plato, ingredientes con cantidades, pasos numerados, y macros aproximados al final.");

    setPhase("chat");
    await send(lines.join("\n"));
  };

  // ── Wizard phase ─────────────────────────────────────────────────────────

  if (phase === "wizard") {
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
          <button
            onClick={() => { if (step === 0) router.back(); else setStep((s) => s - 1); }}
            style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.06)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 5l-7 7 7 7" stroke="#1C1C1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>🥗</span>
              <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>Comidas</span>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>R&A · {isAlejandro ? "Alejandro" : "Rut"}</p>
          </div>
        </motion.div>

        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: "16px 0 0" }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                width: i === step ? 20 : 8, height: 8, borderRadius: 4,
                background: i === step ? accentColor : i < step ? `${accentColor}60` : "rgba(0,0,0,0.12)",
                transition: "all 0.25s ease",
              }}
            />
          ))}
        </div>

        {/* Step content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 16px 16px" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22 }}
            >
              <p style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 20, marginTop: 0 }}>
                {STEP_LABELS[step]}
              </p>

              {step === 0 && (
                <ChipGroup options={MODOS} selected={modo} onSelect={(v) => { setModo(v); setStep(1); }} accentColor={accentColor} />
              )}

              {step === 1 && (
                <ChipGroup options={TIEMPOS} selected={tiempo} onSelect={(v) => { setTiempo(v); setStep(2); }} accentColor={accentColor} />
              )}

              {step === 2 && (
                <ChipGroup options={ELABORACIONES} selected={elaboracion} onSelect={(v) => { setElaboracion(v); setStep(3); }} accentColor={accentColor} />
              )}

              {step === 3 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <textarea
                    value={ingredientes}
                    onChange={(e) => setIngredientes(e.target.value)}
                    placeholder="ej. pollo, arroz, tomate..."
                    rows={4}
                    style={{
                      width: "100%", padding: "12px 14px", borderRadius: 14, border: "1px solid rgba(0,0,0,0.10)",
                      background: "white", fontSize: 15, color: "var(--text-primary)", fontFamily: "inherit",
                      resize: "none", outline: "none", boxSizing: "border-box",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    }}
                  />
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setStep(4)}
                      style={{
                        padding: "14px 0", borderRadius: 16, border: "none",
                        background: accentColor, color: "white", fontSize: 15, fontWeight: 600,
                        cursor: "pointer", boxShadow: `0 4px 16px ${accentColor}40`,
                      }}
                    >
                      Continuar →
                    </motion.button>
                    <button
                      onClick={() => { setIngredientes(""); setStep(4); }}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text-tertiary)", padding: "4px 0" }}
                    >
                      Saltar
                    </button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <ChipGroup options={RESTRICCIONES} selected={restricciones} onSelect={toggleRestriccion} accentColor={accentColor} multiSelect />
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleGenerate}
                    style={{
                      padding: "16px 0", borderRadius: 16, border: "none",
                      background: accentColor, color: "white", fontSize: 16, fontWeight: 700,
                      cursor: "pointer", boxShadow: `0 4px 20px ${accentColor}40`,
                    }}
                  >
                    Generar receta 🍽️
                  </motion.button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
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
        <button onClick={() => setPhase("wizard")} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.06)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="#1C1C1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>🥗</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>Comidas</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>R&A · {isAlejandro ? "Alejandro" : "Rut"}</p>
        </div>
      </motion.div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
        {messages.map((msg, i) => (
          <ChatBubble key={i} role={msg.role} content={msg.content} accentColor={accentColor} />
        ))}
        {isLoading && <ChatBubble role="assistant" content="" isLoading accentColor={accentColor} />}
        <div ref={messagesEndRef} />
      </div>

      <InputBar onSend={(content) => send(content)} disabled={isLoading} placeholder="Pregunta algo más..." accentColor={accentColor} />
    </div>
  );
}

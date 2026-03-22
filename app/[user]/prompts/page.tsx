"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore, UserName } from "@/store/userStore";

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

const HERRAMIENTAS = ["Claude 🤖", "Midjourney 🎨", "DALL-E 🖼️", "Runway 🎬", "ElevenLabs 🎙️", "ChatGPT 💬", "Sora 🎥"];
const EXTENSIONES = ["Breve ~50p", "Medio ~200p", "Largo ~500p", "Muy detallado ~1000p"];
const DIFICULTADES = ["Básico", "Intermedio", "Avanzado", "Experto"];
const AUDIENCIAS = ["General", "Técnico", "Creativo", "Empresarial", "Educativo", "Infantil", "Desarrolladores"];
const FORMATOS = ["Párrafo", "Lista numerada", "Tabla", "Paso a paso", "JSON", "Código", "Mixto"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PromptsPage() {
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

  const [herramienta, setHerramienta] = useState<string | null>(null);
  const [extension, setExtension] = useState<string | null>(null);
  const [dificultad, setDificultad] = useState<string | null>(null);
  const [audiencia, setAudiencia] = useState<string[]>([]);
  const [formato, setFormato] = useState<string | null>(null);
  const [objetivo, setObjetivo] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [formCollapsed, setFormCollapsed] = useState(false);

  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result) {
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [result]);

  const toggleAudiencia = (v: string) => {
    setAudiencia((prev) => prev.includes(v) ? prev.filter((a) => a !== v) : [...prev, v]);
  };

  const canGenerate = !!(herramienta && objetivo.trim());

  const buildPrompt = useCallback(() => {
    const tool = herramienta ?? "";
    const lines = [
      `Genera un prompt optimizado para ${tool}.`,
      extension ? `Extensión: ${extension} palabras aprox.` : "",
      dificultad ? `Dificultad/complejidad: ${dificultad}` : "",
      audiencia.length > 0 ? `Dirigido a: ${audiencia.join(", ")}` : "",
      formato ? `Formato de salida: ${formato}` : "",
      `Objetivo: ${objetivo}`,
      "",
      `El prompt debe estar listo para copiar y pegar directamente en ${tool}. Solo devuelve el prompt en sí, sin explicaciones adicionales, sin markdown que lo envuelva.`,
    ].filter((l) => l !== undefined);
    return lines.join("\n");
  }, [herramienta, extension, dificultad, audiencia, formato, objetivo]);

  const handleGenerate = async () => {
    if (!canGenerate || isLoading) return;
    setIsLoading(true);
    setResult(null);
    setFormCollapsed(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: buildPrompt() }],
          userId: resolvedUserId,
          userName: userParam,
          module: "prompts",
        }),
      });

      if (!response.ok || !response.body) throw new Error("Stream failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      setResult("");
      setIsLoading(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split("\n")) {
          if (line.startsWith("data: ") && line.slice(6) !== "[DONE]") {
            try {
              const t = JSON.parse(line.slice(6)).text;
              if (t) {
                accumulated += t;
                setResult(accumulated);
              }
            } catch {}
          }
        }
      }
    } catch {
      setIsLoading(false);
      setResult("Lo siento, hubo un error. Inténtalo de nuevo.");
      setFormCollapsed(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

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
            <span style={{ fontSize: 20 }}>✍️</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>Prompts</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>R&A · {isAlejandro ? "Alejandro" : "Rut"}</p>
        </div>
      </motion.div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 24px" }}>

        {/* Collapsed form toggle */}
        {formCollapsed && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setFormCollapsed(false)}
            style={{
              width: "100%", padding: "12px 16px", borderRadius: 14, border: "1.5px solid rgba(0,0,0,0.08)",
              background: "white", cursor: "pointer", marginBottom: 20, textAlign: "left",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <span style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>
              {herramienta ?? "Sin herramienta"} · {objetivo.slice(0, 40)}{objetivo.length > 40 ? "..." : ""}
            </span>
            <span style={{ fontSize: 12, color: accentColor, fontWeight: 600 }}>Editar</span>
          </motion.button>
        )}

        {/* Form */}
        <AnimatePresence>
          {!formCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 8 }}>

                <div>
                  <SectionLabel>Herramienta *</SectionLabel>
                  <ChipGroup options={HERRAMIENTAS} selected={herramienta} onSelect={(v) => setHerramienta(herramienta === v ? null : v)} accentColor={accentColor} />
                </div>

                <div>
                  <SectionLabel>Extensión</SectionLabel>
                  <ChipGroup options={EXTENSIONES} selected={extension} onSelect={(v) => setExtension(extension === v ? null : v)} accentColor={accentColor} />
                </div>

                <div>
                  <SectionLabel>Dificultad</SectionLabel>
                  <ChipGroup options={DIFICULTADES} selected={dificultad} onSelect={(v) => setDificultad(dificultad === v ? null : v)} accentColor={accentColor} />
                </div>

                <div>
                  <SectionLabel>Dirigido a (multi)</SectionLabel>
                  <ChipGroup options={AUDIENCIAS} selected={audiencia} onSelect={toggleAudiencia} accentColor={accentColor} multiSelect />
                </div>

                <div>
                  <SectionLabel>Formato de salida</SectionLabel>
                  <ChipGroup options={FORMATOS} selected={formato} onSelect={(v) => setFormato(formato === v ? null : v)} accentColor={accentColor} />
                </div>

                <div>
                  <SectionLabel>Objetivo del prompt *</SectionLabel>
                  <textarea
                    value={objetivo}
                    onChange={(e) => setObjetivo(e.target.value)}
                    placeholder="Describe qué quieres conseguir con este prompt..."
                    rows={4}
                    style={{
                      width: "100%", padding: "12px 14px", borderRadius: 14,
                      border: "1px solid rgba(0,0,0,0.10)", background: "white",
                      fontSize: 15, color: "var(--text-primary)", fontFamily: "inherit",
                      resize: "none", outline: "none", boxSizing: "border-box",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    }}
                  />
                </div>

                <motion.button
                  whileTap={canGenerate ? { scale: 0.97 } : {}}
                  onClick={handleGenerate}
                  disabled={!canGenerate || isLoading}
                  style={{
                    width: "100%", padding: "16px 0", borderRadius: 16, border: "none",
                    background: canGenerate ? accentColor : "rgba(0,0,0,0.08)",
                    color: canGenerate ? "white" : "var(--text-quaternary)",
                    fontSize: 16, fontWeight: 700,
                    cursor: canGenerate ? "pointer" : "not-allowed",
                    boxShadow: canGenerate ? `0 4px 20px ${accentColor}40` : "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  {isLoading ? "Generando..." : "⚡ Generar prompt"}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result card */}
        <AnimatePresence>
          {(result !== null || isLoading) && (
            <motion.div
              ref={resultRef}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3 }}
              style={{
                background: "white", borderRadius: 20, padding: "20px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                border: "1px solid rgba(0,0,0,0.05)",
                marginTop: formCollapsed ? 0 : 24,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-tertiary)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Prompt generado
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRegenerate}
                    disabled={isLoading}
                    style={{
                      padding: "6px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.10)",
                      background: "white", cursor: isLoading ? "not-allowed" : "pointer",
                      fontSize: 12, color: "var(--text-secondary)", fontWeight: 500,
                    }}
                  >
                    🔄 Regenerar
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopy}
                    disabled={!result || isLoading}
                    style={{
                      padding: "6px 12px", borderRadius: 10, border: "none",
                      background: copied ? "#34C759" : accentColor,
                      cursor: result ? "pointer" : "not-allowed",
                      fontSize: 12, color: "white", fontWeight: 600,
                      transition: "background 0.2s ease",
                    }}
                  >
                    {copied ? "✓ Copiado" : "📋 Copiar prompt"}
                  </motion.button>
                </div>
              </div>

              {isLoading && !result ? (
                <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "8px 0" }}>
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                      style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(0,0,0,0.3)", display: "block" }}
                    />
                  ))}
                </div>
              ) : (
                <p style={{
                  fontSize: 14, lineHeight: 1.65, color: "var(--text-primary)",
                  whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0,
                  fontFamily: "var(--font-outfit), monospace",
                }}>
                  {result}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

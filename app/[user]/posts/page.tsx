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

// ─── Icons ────────────────────────────────────────────────────────────────────

function LinkedInIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="#0077B5">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24">
      <defs>
        <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F58529" />
          <stop offset="50%" stopColor="#DD2A7B" />
          <stop offset="100%" stopColor="#515BD4" />
        </linearGradient>
      </defs>
      <path fill="url(#ig-grad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LINKEDIN_FORMATOS = ["Post 📝", "Reflexión 💭", "Logro 🏆", "Tendencia 📈", "Hilo 🧵"];
const INSTAGRAM_FORMATOS = ["Publicación 🖼️", "Historia 📖", "Reel 🎬", "Carrusel 🎠", "Collab 🤝"];
const CUENTAS = ["Personal", "Empresa 🇮🇹"];
const TONOS = ["Profesional", "Casual", "Inspiracional", "Educativo", "Humorístico", "Storytelling"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PostsPage() {
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

  const [phase, setPhase] = useState<"config" | "chat">("config");
  const [plataforma, setPlataforma] = useState<"linkedin" | "instagram" | null>(null);
  const [formato, setFormato] = useState<string | null>(null);
  const [cuenta, setCuenta] = useState<string | null>(null);
  const [tono, setTono] = useState<string | null>(null);
  const [tema, setTema] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, send } = useChatStream({
    userId: resolvedUserId,
    userName: userParam,
    module: "posts",
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const isEmpresa = cuenta === "Empresa 🇮🇹";
  const formatos = plataforma === "linkedin" ? LINKEDIN_FORMATOS : plataforma === "instagram" ? INSTAGRAM_FORMATOS : [];

  const buildRedactarPrompt = () => {
    const lines = [
      `Escribe un ${formato} para ${plataforma === "linkedin" ? "LinkedIn" : "Instagram"} en la cuenta ${cuenta}.`,
      `Tono: ${tono}`,
      `Tema: ${tema}`,
    ];
    if (plataforma === "linkedin") lines.push("Máximo 280 palabras, incluye CTA y 5 hashtags al final.");
    if (plataforma === "instagram") lines.push("Caption impactante, máximo 150 palabras, CTA + 15 hashtags al final.");
    if (isEmpresa) lines.push("Recuerda que es para la empresa en la que estoy de prácticas en Italia — tono más corporativo pero auténtico.");
    return lines.join("\n");
  };

  const buildIdeasPrompt = () => {
    const plat = plataforma === "linkedin" ? "LinkedIn" : "Instagram";
    const lines = [
      `Dame 5 ideas de contenido para ${plat} ${formato} en la cuenta ${cuenta}, tono ${tono}.`,
      "Cada idea: título, hook de la primera línea, y por qué funcionaría.",
    ];
    if (isEmpresa) lines.push("Ideas para empresa italiana donde estoy de prácticas en el área de redes sociales.");
    return lines.join("\n");
  };

  const handleSend = async (promptFn: () => string) => {
    setPhase("chat");
    await send(promptFn());
  };

  const configComplete = !!(plataforma && formato && cuenta && tono);

  // ── Config phase ─────────────────────────────────────────────────────────

  if (phase === "config") {
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
              <span style={{ fontSize: 20 }}>📱</span>
              <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>Posts</span>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>R&A · {isAlejandro ? "Alejandro" : "Rut"}</p>
          </div>
        </motion.div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 16px" }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ display: "flex", flexDirection: "column", gap: 28 }}>

            {/* Step 1: Plataforma */}
            <div>
              <SectionLabel>Plataforma</SectionLabel>
              <div style={{ display: "flex", gap: 12 }}>
                {(["linkedin", "instagram"] as const).map((p) => {
                  const isSelected = plataforma === p;
                  return (
                    <motion.button
                      key={p}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { setPlataforma(p); setFormato(null); }}
                      style={{
                        flex: 1, padding: "18px 12px", borderRadius: 18,
                        border: isSelected ? `2px solid ${accentColor}` : "2px solid rgba(0,0,0,0.06)",
                        background: "white", cursor: "pointer",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                        boxShadow: isSelected ? `0 4px 16px ${accentColor}25` : "0 2px 8px rgba(0,0,0,0.06)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {p === "linkedin" ? <LinkedInIcon /> : <InstagramIcon />}
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                        {p === "linkedin" ? "LinkedIn" : "Instagram"}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Formato */}
            <AnimatePresence>
              {plataforma && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <SectionLabel>Formato</SectionLabel>
                  <ChipGroup options={formatos} selected={formato} onSelect={(v) => setFormato(formato === v ? null : v)} accentColor={accentColor} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 3: Cuenta */}
            <div>
              <SectionLabel>Cuenta</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <ChipGroup options={CUENTAS} selected={cuenta} onSelect={(v) => setCuenta(cuenta === v ? null : v)} accentColor={accentColor} />
                <AnimatePresence>
                  {cuenta === "Empresa 🇮🇹" && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ fontSize: 12, color: "var(--text-tertiary)", margin: "4px 0 0 4px" }}
                    >
                      tus prácticas en Italia
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Step 4: Tono */}
            <div>
              <SectionLabel>Tono</SectionLabel>
              <ChipGroup options={TONOS} selected={tono} onSelect={(v) => setTono(tono === v ? null : v)} accentColor={accentColor} />
            </div>

            {/* Step 5: Tema */}
            <div>
              <SectionLabel>Tema / Idea</SectionLabel>
              <textarea
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                placeholder="¿De qué trata el post? Cuéntame la idea, noticia o logro..."
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

            {/* Buttons */}
            <div style={{ display: "flex", gap: 10, paddingBottom: 4 }}>
              <motion.button
                whileTap={configComplete ? { scale: 0.97 } : {}}
                onClick={configComplete ? () => handleSend(buildIdeasPrompt) : undefined}
                style={{
                  flex: 1, padding: "14px 0", borderRadius: 16,
                  border: "1.5px solid rgba(0,0,0,0.10)",
                  background: configComplete ? "white" : "rgba(0,0,0,0.04)",
                  color: configComplete ? "var(--text-primary)" : "var(--text-quaternary)",
                  fontSize: 14, fontWeight: 600, cursor: configComplete ? "pointer" : "not-allowed",
                  boxShadow: configComplete ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                💡 Generar ideas
              </motion.button>
              <motion.button
                whileTap={(configComplete && tema.trim()) ? { scale: 0.97 } : {}}
                onClick={(configComplete && tema.trim()) ? () => handleSend(buildRedactarPrompt) : undefined}
                style={{
                  flex: 1, padding: "14px 0", borderRadius: 16, border: "none",
                  background: (configComplete && tema.trim()) ? accentColor : "rgba(0,0,0,0.08)",
                  color: (configComplete && tema.trim()) ? "white" : "var(--text-quaternary)",
                  fontSize: 14, fontWeight: 600,
                  cursor: (configComplete && tema.trim()) ? "pointer" : "not-allowed",
                  boxShadow: (configComplete && tema.trim()) ? `0 4px 16px ${accentColor}40` : "none",
                  transition: "all 0.2s ease",
                }}
              >
                ✍️ Redactar post
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Chat phase ──────────────────────────────────────────────────────────────

  return (
    <div style={{ height: "100dvh", overflow: "hidden", display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>
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
        <button onClick={() => setPhase("config")} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.06)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="#1C1C1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>📱</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>Posts</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>R&A · {isAlejandro ? "Alejandro" : "Rut"}</p>
        </div>
      </motion.div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
        {messages.map((msg, i) => (
          <ChatBubble key={i} role={msg.role} content={msg.content} accentColor={accentColor} />
        ))}
        {isLoading && <ChatBubble role="assistant" content="" isLoading accentColor={accentColor} />}
        <div ref={messagesEndRef} />
      </div>

      <InputBar onSend={(content) => send(content)} disabled={isLoading} placeholder="Ajusta o pide otro post..." accentColor={accentColor} />
    </div>
  );
}

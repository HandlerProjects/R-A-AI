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

const OCASIONES = ["Casual 🏃", "Trabajo 💼", "Cita 💑", "Fiesta 🎉", "Sport ⚽", "Formal 👔", "Playa 🏖️", "Viaje ✈️"];
const ESTACIONES = ["Primavera 🌸", "Verano ☀️", "Otoño 🍂", "Invierno ❄️"];
const ESTILOS = ["Minimalista", "Clásico", "Streetwear", "Elegante", "Smart casual", "Colorido", "Dark"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OutfitsPage() {
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

  // Config state
  const [phase, setPhase] = useState<"config" | "chat">("config");
  const [ocasion, setOcasion] = useState<string | null>(null);
  const [estacion, setEstacion] = useState<string | null>(null);
  const [estilo, setEstilo] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMediaType, setImageMediaType] = useState<string>("image/jpeg");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [firstMessageHadImage, setFirstMessageHadImage] = useState(false);
  const [firstImagePreview, setFirstImagePreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, send } = useChatStream({
    userId: resolvedUserId,
    userName: userParam,
    module: "outfits",
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const base64 = dataUrl.split(";base64,")[1];
      setImageBase64(base64);
      setImageMediaType(file.type || "image/jpeg");
      setImagePreviewUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageBase64(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const hasSelection = !!(ocasion || estacion || estilo || imageBase64);

  const buildPrompt = () => {
    const lines = ["Quiero ayuda con un outfit."];
    if (imageBase64) lines.push("📸 Aquí te muestro la prenda.");
    if (ocasion) lines.push(`Ocasión: ${ocasion}`);
    if (estacion) lines.push(`Estación: ${estacion}`);
    if (estilo) lines.push(`Estilo: ${estilo}`);
    lines.push("Dame combinaciones concretas y prácticas.");
    return lines.join("\n");
  };

  const handleGenerar = async () => {
    const prompt = buildPrompt();
    const hadImage = !!imageBase64;
    if (hadImage) {
      setFirstMessageHadImage(true);
      setFirstImagePreview(imagePreviewUrl);
    }
    setPhase("chat");
    await send(prompt, hadImage ? { imageBase64: imageBase64!, imageMediaType } : undefined);
  };

  const handleDado = async () => {
    setPhase("chat");
    const prompt = "🎲 MODO DADO — Sorpréndeme completamente. Propón un outfit completo aleatorio para hoy: prenda por prenda, colores y por qué funcionan juntos.";
    await send(prompt);
  };

  const handleChatSend = (content: string) => {
    send(content);
  };

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
              <span style={{ fontSize: 20 }}>👔</span>
              <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>Outfits</span>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>R&A · {isAlejandro ? "Alejandro" : "Rut"}</p>
          </div>
        </motion.div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 16px" }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Photo section */}
            <div>
              <SectionLabel>📸 Foto de prenda (opcional)</SectionLabel>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
              {!imagePreviewUrl ? (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: "10px 18px", borderRadius: 14, border: "1.5px dashed rgba(0,0,0,0.15)",
                    background: "white", color: "var(--text-secondary)", fontSize: 14,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                  }}
                >
                  <span style={{ fontSize: 18 }}>📷</span> Añadir foto
                </motion.button>
              ) : (
                <div style={{ position: "relative", display: "inline-block" }}>
                  <img src={imagePreviewUrl} alt="preview" style={{ width: 100, height: 100, borderRadius: 14, objectFit: "cover", boxShadow: "0 2px 12px rgba(0,0,0,0.10)" }} />
                  <button
                    onClick={removeImage}
                    style={{
                      position: "absolute", top: -6, right: -6, width: 22, height: 22,
                      borderRadius: "50%", background: "#FF3B30", border: "2px solid white",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      color: "white", fontSize: 12, fontWeight: 700, lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Ocasión */}
            <div>
              <SectionLabel>Ocasión</SectionLabel>
              <ChipGroup options={OCASIONES} selected={ocasion} onSelect={(v) => setOcasion(ocasion === v ? null : v)} accentColor={accentColor} />
            </div>

            {/* Estación */}
            <div>
              <SectionLabel>Estación</SectionLabel>
              <ChipGroup options={ESTACIONES} selected={estacion} onSelect={(v) => setEstacion(estacion === v ? null : v)} accentColor={accentColor} />
            </div>

            {/* Estilo */}
            <div>
              <SectionLabel>Estilo</SectionLabel>
              <ChipGroup options={ESTILOS} selected={estilo} onSelect={(v) => setEstilo(estilo === v ? null : v)} accentColor={accentColor} />
            </div>
          </motion.div>
        </div>

        {/* Bottom buttons */}
        <div style={{
          padding: "12px 16px",
          paddingBottom: `calc(12px + env(safe-area-inset-bottom))`,
          background: "rgba(242,242,247,0.95)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(0,0,0,0.07)",
          display: "flex", gap: 10,
        }}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleDado}
            style={{
              flex: 1, padding: "14px 0", borderRadius: 16, border: "1.5px solid rgba(0,0,0,0.10)",
              background: "white", color: "var(--text-primary)", fontSize: 14, fontWeight: 600,
              cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            🎲 Tirar el dado
          </motion.button>
          <motion.button
            whileTap={hasSelection ? { scale: 0.97 } : {}}
            onClick={hasSelection ? handleGenerar : undefined}
            style={{
              flex: 2, padding: "14px 0", borderRadius: 16, border: "none",
              background: hasSelection ? accentColor : "rgba(0,0,0,0.08)",
              color: hasSelection ? "white" : "var(--text-quaternary)",
              fontSize: 14, fontWeight: 600,
              cursor: hasSelection ? "pointer" : "not-allowed",
              boxShadow: hasSelection ? `0 4px 16px ${accentColor}40` : "none",
              transition: "all 0.2s ease",
            }}
          >
            Generar outfit →
          </motion.button>
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
        <button onClick={() => setPhase("config")} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.06)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="#1C1C1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>👔</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>Outfits</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>R&A · {isAlejandro ? "Alejandro" : "Rut"}</p>
        </div>
      </motion.div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
        {messages.map((msg, i) => (
          <div key={i}>
            {/* Show image preview above first user message if it had one */}
            {i === 0 && msg.role === "user" && firstMessageHadImage && firstImagePreview && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
                <img
                  src={firstImagePreview}
                  alt="prenda"
                  style={{ width: 120, height: 120, borderRadius: 16, objectFit: "cover", boxShadow: "0 4px 16px rgba(0,0,0,0.10)" }}
                />
              </div>
            )}
            <ChatBubble role={msg.role} content={msg.content} accentColor={accentColor} />
          </div>
        ))}
        {isLoading && <ChatBubble role="assistant" content="" isLoading accentColor={accentColor} />}
        <div ref={messagesEndRef} />
      </div>

      <InputBar onSend={handleChatSend} disabled={isLoading} placeholder="Continúa la conversación..." accentColor={accentColor} />
    </div>
  );
}

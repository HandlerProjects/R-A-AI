"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChatBubble } from "@/components/ChatBubble";
import { InputBar } from "@/components/InputBar";
import { useUserStore, UserName } from "@/store/userStore";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Destination {
  id: string;
  name: string;
  country: string;
  category: string;
  keyword: string;
  custom?: boolean;
}

const CATEGORIES = ["Todos", "Romántico", "Playa", "Ciudad", "Aventura", "Escapada"];

const DESTINATIONS: Destination[] = [
  { id: "santorini", name: "Santorini", country: "Grecia", category: "Romántico", keyword: "santorini,greece,island" },
  { id: "praga", name: "Praga", country: "República Checa", category: "Ciudad", keyword: "prague,czech,city" },
  { id: "dubrovnik", name: "Dubrovnik", country: "Croacia", category: "Playa", keyword: "dubrovnik,croatia,sea" },
  { id: "lisboa", name: "Lisboa", country: "Portugal", category: "Ciudad", keyword: "lisbon,portugal,city" },
  { id: "amsterdam", name: "Amsterdam", country: "Países Bajos", category: "Ciudad", keyword: "amsterdam,netherlands,canal" },
  { id: "amalfi", name: "Costa Amalfi", country: "Italia", category: "Romántico", keyword: "amalfi,italy,coast" },
  { id: "budapest", name: "Budapest", country: "Hungría", category: "Escapada", keyword: "budapest,hungary,night" },
  { id: "islandia", name: "Islandia", country: "Islandia", category: "Aventura", keyword: "iceland,northern,lights" },
  { id: "marrakech", name: "Marrakech", country: "Marruecos", category: "Aventura", keyword: "marrakech,morocco,market" },
  { id: "florencia", name: "Florencia", country: "Italia", category: "Romántico", keyword: "florence,italy,duomo" },
  { id: "viena", name: "Viena", country: "Austria", category: "Escapada", keyword: "vienna,austria,palace" },
  { id: "mykonos", name: "Mykonos", country: "Grecia", category: "Playa", keyword: "mykonos,greece,white" },
];

const BUDGETS = ["< 300€", "300–700€", "700–1500€", "+1500€"];

const ACCENT = "#FF2D55";

export default function ViajesPage() {
  const params = useParams();
  const router = useRouter();
  const { activeUser, userId, setUser } = useUserStore();

  const userParam = params.user as UserName;
  const resolvedUserId = userId ?? userParam;

  const [phase, setPhase] = useState<"discovery" | "chat">("discovery");
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [customDestInput, setCustomDestInput] = useState("");
  const [customDestinations, setCustomDestinations] = useState<Destination[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAlejandro = userParam === "alejandro";

  useEffect(() => {
    if (userParam && userParam !== activeUser) setUser(userParam, userParam);
  }, [userParam, activeUser, setUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const allDestinations = [...DESTINATIONS, ...customDestinations];

  const filteredDestinations =
    activeFilter === "Todos"
      ? allDestinations
      : allDestinations.filter((d) => d.category === activeFilter);

  const toggleDestination = (id: string) => {
    setSelectedDestinations((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const addCustomDestination = () => {
    const trimmed = customDestInput.trim();
    if (!trimmed) return;
    const newDest: Destination = {
      id: `custom-${Date.now()}`,
      name: trimmed,
      country: "Destino propio",
      category: "Personalizado",
      keyword: "",
      custom: true,
    };
    setCustomDestinations((prev) => [...prev, newDest]);
    setCustomDestInput("");
  };

  const selectedNames = selectedDestinations.map((id) => {
    const dest = allDestinations.find((d) => d.id === id);
    return dest ? dest.name : id;
  });

  const enterChat = () => {
    const introMessage: Message = {
      role: "assistant",
      content: `¡Perfecto! 🌍 Vamos a planificar vuestro viaje.\n\n**Destinos elegidos:** ${selectedNames.join(", ")}\n**Presupuesto:** ${budget || "abierto"}\n\n¿Qué queréis que busque primero? Puedo mirarlo todo — vuelos, alojamiento, viabilidad, qué ver, cuándo ir... ¡decidid vosotros!`,
    };
    setMessages([introMessage]);
    setPhase("chat");
  };

  const sendMessage = useCallback(
    async (content: string) => {
      if (isLoading) return;
      const userMessage: Message = { role: "user", content };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setIsLoading(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages,
            userId: resolvedUserId,
            userName: userParam,
            module: "viajes",
          }),
        });

        if (!response.ok || !response.body) throw new Error();
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = "";

        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
        setIsLoading(false);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of decoder.decode(value).split("\n")) {
            if (line.startsWith("data: ") && line.slice(6) !== "[DONE]") {
              try {
                const t = JSON.parse(line.slice(6)).text;
                if (t) {
                  assistantContent += t;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                    return updated;
                  });
                }
              } catch {}
            }
          }
        }
      } catch {
        setIsLoading(false);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Lo siento, hubo un error. Inténtalo de nuevo." },
        ]);
      }
    },
    [isLoading, messages, resolvedUserId, userParam]
  );

  if (phase === "chat") {
    return (
      <div
        style={{
          height: "100dvh",
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-primary)",
          overflow: "hidden",
        }}
      >
        {/* Chat Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            paddingTop: "calc(12px + env(safe-area-inset-top))",
            background: "rgba(242,242,247,0.92)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(0,0,0,0.07)",
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          <button
            onClick={() => setPhase("discovery")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: ACCENT,
              fontSize: 14,
              fontWeight: 600,
              padding: "6px 0",
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M19 12H5M12 5l-7 7 7 7"
                stroke={ACCENT}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Cambiar
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 18 }}>🌍</span>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  fontFamily: "-apple-system, 'SF Pro Display', sans-serif",
                }}
              >
                Viajes
              </span>
            </div>
            <div
              style={{
                display: "flex",
                gap: 4,
                marginTop: 3,
                flexWrap: "nowrap",
                overflowX: "auto",
                scrollbarWidth: "none",
              }}
            >
              {selectedNames.slice(0, 3).map((name) => (
                <span
                  key={name}
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: ACCENT,
                    background: "rgba(255,45,85,0.1)",
                    borderRadius: 10,
                    padding: "2px 7px",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {name}
                </span>
              ))}
              {selectedNames.length > 3 && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "var(--text-tertiary)",
                    background: "rgba(0,0,0,0.05)",
                    borderRadius: 10,
                    padding: "2px 7px",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  +{selectedNames.length - 3}
                </span>
              )}
              {budget && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#007AFF",
                    background: "rgba(0,122,255,0.1)",
                    borderRadius: 10,
                    padding: "2px 7px",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {budget}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            background: "var(--bg-primary)",
          }}
        >
          {messages.map((msg, i) => (
            <ChatBubble key={i} role={msg.role} content={msg.content} accentColor={ACCENT} />
          ))}
          {isLoading && <ChatBubble role="assistant" content="" isLoading accentColor={ACCENT} />}
          <div ref={messagesEndRef} />
        </div>

        <InputBar
          onSend={sendMessage}
          disabled={isLoading}
          placeholder="Pregunta sobre vuelos, alojamiento, itinerarios..."
          accentColor={ACCENT}
        />
      </div>
    );
  }

  // ─── DISCOVERY PHASE ───────────────────────────────────────────
  return (
    <div
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-primary)",
        overflow: "hidden",
      }}
    >
      {/* Discovery Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          paddingTop: "calc(12px + env(safe-area-inset-top))",
          background: "rgba(242,242,247,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,0,0,0.07)",
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "rgba(0,0,0,0.06)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M19 12H5M12 5l-7 7 7 7"
              stroke="#1C1C1E"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 20 }}>🌍</span>
          <span
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "var(--text-primary)",
              fontFamily: "-apple-system, 'SF Pro Display', sans-serif",
            }}
          >
            Viajes
          </span>
        </div>

        <span
          style={{
            fontSize: 12,
            color: "var(--text-tertiary)",
            fontWeight: 500,
          }}
        >
          R&A · {isAlejandro ? "Alejandro" : "Rut"}
        </span>
      </motion.div>

      {/* Scrollable content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          paddingBottom: "calc(90px + env(safe-area-inset-bottom))",
        }}
      >
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          style={{
            padding: "24px 20px 20px",
            background: "linear-gradient(160deg, #fff0f3 0%, #fff5f0 60%, #f5f0ff 100%)",
            borderBottom: "1px solid rgba(255,45,85,0.08)",
          }}
        >
          <h1
            style={{
              fontSize: 30,
              fontWeight: 800,
              color: "var(--text-primary)",
              margin: "0 0 6px",
              letterSpacing: "-0.5px",
              fontFamily: "-apple-system, 'SF Pro Display', sans-serif",
            }}
          >
            ¿A dónde vais?
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "var(--text-tertiary)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Elige destinos, presupuesto y planificad juntos
          </p>
        </motion.div>

        {/* Category filter pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          style={{
            display: "flex",
            gap: 8,
            padding: "16px 16px 8px",
            overflowX: "auto",
            scrollbarWidth: "none",
            flexShrink: 0,
          }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              style={{
                flexShrink: 0,
                padding: "7px 16px",
                borderRadius: 20,
                border: activeFilter === cat ? "none" : "1px solid rgba(0,0,0,0.1)",
                background: activeFilter === cat ? ACCENT : "white",
                color: activeFilter === cat ? "white" : "var(--text-secondary)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow:
                  activeFilter === cat
                    ? "0 2px 10px rgba(255,45,85,0.3)"
                    : "0 1px 4px rgba(0,0,0,0.06)",
                transition: "all 0.2s ease",
              }}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Destinations grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            padding: "12px 16px 0",
          }}
        >
          <AnimatePresence mode="popLayout">
            {filteredDestinations.map((dest, i) => {
              const isSelected = selectedDestinations.includes(dest.id);
              return (
                <motion.button
                  key={dest.id}
                  layout
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.88 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 24,
                    delay: i * 0.04,
                  }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => toggleDestination(dest.id)}
                  style={{
                    position: "relative",
                    height: 160,
                    borderRadius: 16,
                    border: isSelected ? `2px solid ${ACCENT}` : "2px solid transparent",
                    overflow: "hidden",
                    cursor: "pointer",
                    background: dest.custom
                      ? "linear-gradient(135deg, #FF2D55 0%, #FF6B35 100%)"
                      : "#e0e0e0",
                    boxShadow: isSelected
                      ? `0 4px 20px rgba(255,45,85,0.35)`
                      : "0 2px 12px rgba(0,0,0,0.1)",
                    padding: 0,
                    textAlign: "left",
                    transition: "box-shadow 0.2s ease, border-color 0.2s ease",
                  }}
                >
                  {/* Background image */}
                  {!dest.custom && (
                    <img
                      src={`https://source.unsplash.com/featured/400x300/?${dest.keyword}`}
                      alt={dest.name}
                      loading="lazy"
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  )}

                  {/* Gradient overlay */}
                  {!dest.custom && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)",
                      }}
                    />
                  )}

                  {/* Selected checkmark */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          width: 26,
                          height: 26,
                          borderRadius: "50%",
                          background: ACCENT,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          boxShadow: "0 2px 8px rgba(255,45,85,0.4)",
                          zIndex: 2,
                        }}
                      >
                        ✓
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Text content */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: "10px 12px",
                      zIndex: 1,
                    }}
                  >
                    {/* Category pill */}
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: 10,
                        fontWeight: 600,
                        color: "white",
                        background: "rgba(255,255,255,0.2)",
                        borderRadius: 8,
                        padding: "2px 7px",
                        marginBottom: 5,
                        backdropFilter: "blur(4px)",
                        WebkitBackdropFilter: "blur(4px)",
                        border: "1px solid rgba(255,255,255,0.25)",
                      }}
                    >
                      {dest.category}
                    </span>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        fontWeight: 700,
                        color: "white",
                        lineHeight: 1.2,
                        letterSpacing: "-0.2px",
                        textShadow: dest.custom ? "none" : "0 1px 4px rgba(0,0,0,0.3)",
                      }}
                    >
                      {dest.name}
                    </p>
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontSize: 11,
                        color: "rgba(255,255,255,0.8)",
                        fontWeight: 500,
                        textShadow: dest.custom ? "none" : "0 1px 3px rgba(0,0,0,0.3)",
                      }}
                    >
                      {dest.country}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Add custom destination */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            margin: "16px 16px 0",
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <input
            value={customDestInput}
            onChange={(e) => setCustomDestInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addCustomDestination();
            }}
            placeholder="Añadir destino propio..."
            style={{
              flex: 1,
              height: 44,
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.1)",
              background: "white",
              padding: "0 14px",
              fontSize: 14,
              color: "var(--text-primary)",
              outline: "none",
              fontFamily: "inherit",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          />
          <button
            onClick={addCustomDestination}
            disabled={!customDestInput.trim()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: customDestInput.trim() ? ACCENT : "rgba(0,0,0,0.08)",
              border: "none",
              cursor: customDestInput.trim() ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              color: customDestInput.trim() ? "white" : "var(--text-tertiary)",
              fontWeight: 400,
              transition: "background 0.2s ease",
              flexShrink: 0,
              boxShadow: customDestInput.trim() ? "0 2px 10px rgba(255,45,85,0.3)" : "none",
            }}
          >
            +
          </button>
        </motion.div>

        {/* Budget selector */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{ padding: "24px 16px 0" }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--text-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              margin: "0 0 12px",
            }}
          >
            Presupuesto por persona
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {BUDGETS.map((b) => (
              <button
                key={b}
                onClick={() => setBudget(budget === b ? "" : b)}
                style={{
                  padding: "9px 18px",
                  borderRadius: 22,
                  border: budget === b ? "none" : "1px solid rgba(0,0,0,0.1)",
                  background: budget === b ? ACCENT : "white",
                  color: budget === b ? "white" : "var(--text-secondary)",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow:
                    budget === b
                      ? "0 3px 12px rgba(255,45,85,0.3)"
                      : "0 1px 4px rgba(0,0,0,0.06)",
                  transition: "all 0.2s ease",
                }}
              >
                {b}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Spacer */}
        <div style={{ height: 20 }} />
      </div>

      {/* Sticky bottom bar */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "12px 16px",
          paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
          background: "rgba(242,242,247,0.96)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          zIndex: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color:
                selectedDestinations.length > 0 ? "var(--text-primary)" : "var(--text-tertiary)",
              fontWeight: selectedDestinations.length > 0 ? 600 : 400,
            }}
          >
            {selectedDestinations.length > 0
              ? `${selectedDestinations.length} destino${selectedDestinations.length > 1 ? "s" : ""} seleccionado${selectedDestinations.length > 1 ? "s" : ""}`
              : "Elige al menos un destino"}
          </p>
          {budget && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: ACCENT,
                background: "rgba(255,45,85,0.1)",
                borderRadius: 10,
                padding: "3px 9px",
              }}
            >
              {budget}
            </span>
          )}
        </div>
        <motion.button
          whileTap={selectedDestinations.length > 0 ? { scale: 0.97 } : {}}
          onClick={selectedDestinations.length > 0 ? enterChat : undefined}
          disabled={selectedDestinations.length === 0}
          style={{
            width: "100%",
            height: 52,
            borderRadius: 16,
            border: "none",
            background:
              selectedDestinations.length > 0
                ? `linear-gradient(135deg, ${ACCENT} 0%, #FF6B35 100%)`
                : "rgba(0,0,0,0.1)",
            color: selectedDestinations.length > 0 ? "white" : "var(--text-tertiary)",
            fontSize: 16,
            fontWeight: 700,
            cursor: selectedDestinations.length > 0 ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            boxShadow:
              selectedDestinations.length > 0
                ? "0 4px 20px rgba(255,45,85,0.35)"
                : "none",
            transition: "all 0.25s ease",
            letterSpacing: "-0.2px",
          }}
        >
          Planificar con IA
          {selectedDestinations.length > 0 && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12h14M12 5l7 7-7 7"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </motion.button>
      </div>
    </div>
  );
}

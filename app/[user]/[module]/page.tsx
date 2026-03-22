"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChatBubble } from "@/components/ChatBubble";
import { InputBar } from "@/components/InputBar";
import { useUserStore, UserName } from "@/store/userStore";
import { saveConversation, loadConversation, getUserId } from "@/lib/memory";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const MODULE_TITLES: Record<string, { title: string; icon: string }> = {
  outfits: { title: "Outfits", icon: "👔" },
  comidas: { title: "Comidas", icon: "🥗" },
  posts: { title: "Posts", icon: "📱" },
  psicologo: { title: "Psicólogo", icon: "🧘" },
  prompts: { title: "Prompts", icon: "✍️" },
  automatizaciones: { title: "Automatizaciones", icon: "⚙️" },
  proyectos: { title: "Proyectos", icon: "🚀" },
  tfg: { title: "TFG Psicología", icon: "🎓" },
  estudios: { title: "Estudios", icon: "📚" },
  plans: { title: "Planes de pareja", icon: "💑" },
  italian: { title: "Italiano", icon: "🇮🇹" },
  chat: { title: "Chat libre R&A", icon: "💬" },
};

export default function ModulePage() {
  const params = useParams();
  const router = useRouter();
  const { activeUser, userId, setUser } = useUserStore();

  const userParam = params.user as UserName;
  const moduleParam = params.module as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const moduleInfo = MODULE_TITLES[moduleParam] ?? { title: moduleParam, icon: "💬" };

  // Sync URL param with store
  useEffect(() => {
    if (userParam && userParam !== activeUser) {
      setUser(userParam, userParam);
    }
  }, [userParam, activeUser, setUser]);

  // Load conversation history
  useEffect(() => {
    const loadHistory = async () => {
      const resolvedUserId = userId ?? userParam;
      if (!resolvedUserId) return;

      try {
        const conv = await loadConversation(resolvedUserId, moduleParam);
        if (conv && conv.messages.length > 0) {
          setMessages(conv.messages as Message[]);
          setConversationId(conv.id);
        }
      } catch {
        // No history yet
      }
    };

    loadHistory();
  }, [userId, userParam, moduleParam]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (isLoading) return;

      const userMessage: Message = { role: "user", content };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setIsLoading(true);

      const resolvedUserId = userId ?? userParam;

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages,
            userId: resolvedUserId,
            userName: userParam,
            module: moduleParam,
          }),
        });

        if (!response.ok) throw new Error("API error");
        if (!response.body) throw new Error("No response body");

        // Stream response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = "";

        // Add empty assistant message
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
        setIsLoading(false);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") break;

              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  assistantContent += parsed.text;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      role: "assistant",
                      content: assistantContent,
                    };
                    return updated;
                  });
                }
              } catch {
                // Skip malformed chunks
              }
            }
          }
        }

        // Save conversation
        const finalMessages = [
          ...updatedMessages,
          { role: "assistant" as const, content: assistantContent },
        ];

        try {
          await saveConversation(resolvedUserId, moduleParam, finalMessages, conversationId);
        } catch {
          // Save failed silently
        }
      } catch (error) {
        setIsLoading(false);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Lo siento, hubo un error. Inténtalo de nuevo.",
          },
        ]);
      }
    },
    [isLoading, messages, userId, userParam, moduleParam, conversationId]
  );

  const clearChat = () => {
    setMessages([]);
    setConversationId(undefined);
  };

  return (
    <div
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "#0a0a0a",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          paddingTop: `calc(12px + env(safe-area-inset-top))`,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(10,10,10,0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        {/* Back button */}
        <button
          onClick={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M19 12H5M12 5l-7 7 7 7"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Title */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>{moduleInfo.icon}</span>
            <span
              style={{
                fontSize: 17,
                fontWeight: 600,
                color: "white",
                fontFamily: "var(--font-display)",
              }}
            >
              {moduleInfo.title}
            </span>
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>
            R&A · {userParam === "alejandro" ? "Alejandro" : "Rut"}
          </p>
        </div>

        {/* Clear chat */}
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            style={{
              padding: "6px 12px",
              borderRadius: 20,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.5)",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Limpiar
          </button>
        )}
      </motion.div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {messages.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              paddingBottom: 40,
            }}
          >
            <span style={{ fontSize: 48 }}>{moduleInfo.icon}</span>
            <p
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: "white",
                margin: 0,
                textAlign: "center",
              }}
            >
              {moduleInfo.title}
            </p>
            <p
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.4)",
                margin: 0,
                textAlign: "center",
                maxWidth: 240,
                lineHeight: 1.5,
              }}
            >
              ¿En qué te ayudo hoy?
            </p>
          </motion.div>
        )}

        {messages.map((msg, i) => (
          <ChatBubble key={i} role={msg.role} content={msg.content} />
        ))}

        {isLoading && <ChatBubble role="assistant" content="" isLoading />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <InputBar
        onSend={sendMessage}
        disabled={isLoading}
        placeholder={`Escribe a R&A...`}
      />
    </div>
  );
}

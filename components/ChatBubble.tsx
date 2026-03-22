"use client";

import { motion } from "framer-motion";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
  accentColor?: string;
}

export function ChatBubble({ role, content, isLoading, accentColor = "#1C1C1E" }: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 340, damping: 26 }}
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 6,
        paddingLeft: isUser ? 48 : 0,
        paddingRight: isUser ? 0 : 48,
      }}
    >
      <div style={{
        maxWidth: "100%",
        padding: "11px 15px",
        borderRadius: isUser ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
        background: isUser ? accentColor : "white",
        color: isUser ? "white" : "var(--text-primary)",
        fontSize: 15,
        lineHeight: 1.55,
        boxShadow: isUser ? "none" : "0 1px 6px rgba(0,0,0,0.07)",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        border: isUser ? "none" : "1px solid rgba(0,0,0,0.05)",
      }}>
        {isLoading ? <LoadingDots /> : content}
      </div>
    </motion.div>
  );
}

function LoadingDots() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "2px 0" }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(0,0,0,0.3)", display: "block" }}
        />
      ))}
    </div>
  );
}

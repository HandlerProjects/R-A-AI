"use client";

import { motion } from "framer-motion";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
}

export function ChatBubble({ role, content, isLoading }: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 4,
        paddingLeft: isUser ? 40 : 0,
        paddingRight: isUser ? 0 : 40,
      }}
    >
      <div
        style={{
          maxWidth: "100%",
          padding: "12px 16px",
          borderRadius: isUser ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
          background: isUser
            ? "#1D1D1F"
            : "rgba(255,255,255,0.08)",
          color: "white",
          fontSize: 15,
          lineHeight: 1.55,
          backdropFilter: isUser ? "none" : "blur(10px)",
          border: isUser ? "none" : "1px solid rgba(255,255,255,0.08)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {isLoading ? (
          <LoadingDots />
        ) : (
          content
        )}
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
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
          }}
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.6)",
            display: "block",
          }}
        />
      ))}
    </div>
  );
}

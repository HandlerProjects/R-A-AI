"use client";

import { motion } from "framer-motion";

interface UserCardProps {
  name: "alejandro" | "rut";
  subtitle: string;
  avatarColor: string;
  avatarLetter: string;
  onClick: () => void;
  delay?: number;
}

export function UserCard({
  name,
  subtitle,
  avatarColor,
  avatarLetter,
  onClick,
  delay = 0,
}: UserCardProps) {
  const displayName = name === "alejandro" ? "Alejandro" : "Rut";

  return (
    <motion.button
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 24,
        delay,
      }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.4)",
        borderRadius: 28,
        padding: "28px 24px",
        width: "calc(50% - 8px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
        textAlign: "center",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: avatarColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "3px solid white",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: "white",
            fontFamily: "var(--font-display)",
            lineHeight: 1,
          }}
        >
          {avatarLetter}
        </span>
      </div>

      {/* Name */}
      <span
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: "#1D1D1F",
          fontFamily: "var(--font-display)",
          lineHeight: 1.2,
        }}
      >
        {displayName}
      </span>

      {/* Subtitle */}
      <span
        style={{
          fontSize: 13,
          fontWeight: 400,
          color: "#636366",
          lineHeight: 1.3,
        }}
      >
        {subtitle}
      </span>
    </motion.button>
  );
}

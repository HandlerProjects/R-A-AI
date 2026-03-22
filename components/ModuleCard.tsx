"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";

interface ModuleCardProps {
  id: string;
  icon: string;
  title: string;
  description: string;
  color?: string;
  delay?: number;
  shared?: boolean;
}

export function ModuleCard({
  id,
  icon,
  title,
  description,
  color = "rgba(255,255,255,0.06)",
  delay = 0,
  shared = false,
}: ModuleCardProps) {
  const router = useRouter();
  const { activeUser } = useUserStore();

  const handlePress = () => {
    if (!activeUser) return;
    router.push(`/${activeUser}/${id}`);
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 280,
        damping: 22,
        delay,
      }}
      whileTap={{ scale: 0.97 }}
      onClick={handlePress}
      style={{
        background: color,
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        padding: "20px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 8,
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {shared && (
        <span
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            fontSize: 10,
            fontWeight: 600,
            color: "rgba(255,255,255,0.4)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Compartido
        </span>
      )}

      <span style={{ fontSize: 28 }}>{icon}</span>

      <div>
        <p
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "#f5f5f7",
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.45)",
            margin: "4px 0 0",
            lineHeight: 1.4,
          }}
        >
          {description}
        </p>
      </div>
    </motion.button>
  );
}

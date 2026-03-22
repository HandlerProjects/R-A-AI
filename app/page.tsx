"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase";

function getWelcomeDate() {
  const now = new Date();
  const days = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const day = days[now.getDay()];
  const date = now.getDate();
  const month = months[now.getMonth()];
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12 || 12;
  return `${day} ${date} de ${month} · ${hours}:${minutes}${ampm}`;
}

export default function SplashPage() {
  const router = useRouter();
  const { setUser } = useUserStore();
  const [showCards, setShowCards] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    setDateStr(getWelcomeDate());
    const timer = setTimeout(() => setShowCards(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSelectUser = async (name: "alejandro" | "rut") => {
    if (loading) return;
    setLoading(name);
    try {
      const { data } = await supabase.from("users").select("id").eq("name", name).single();
      setUser(name, data?.id ?? name);
    } catch {
      setUser(name, name);
    }
    router.push(`/${name}`);
  };

  return (
    <div style={{
      width: "100%",
      height: "100dvh",
      overflow: "hidden",
      background: "#F2F2F7",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}>

      {/* Top section */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 24px",
        paddingTop: "env(safe-area-inset-top)",
        width: "100%",
      }}>

        {/* R&A Logo */}
        <motion.div
          initial={{ opacity: 0, y: -24, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          style={{ textAlign: "center", marginBottom: 8 }}
        >
          <h1 style={{
            fontSize: "clamp(80px, 22vw, 108px)",
            fontWeight: 800,
            color: "#1C1C1E",
            letterSpacing: "-4px",
            lineHeight: 0.92,
            margin: 0,
            fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
          }}>
            R&A
          </h1>

          {/* Divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              height: 1.5,
              background: "linear-gradient(90deg, transparent, #C7C7CC, transparent)",
              borderRadius: 1,
              marginTop: 10,
              transformOrigin: "center",
            }}
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "#AEAEB2",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              margin: "10px 0 0",
            }}
          >
            Your Personal AI
          </motion.p>
        </motion.div>

        {/* Welcome message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.45 }}
          style={{
            marginTop: 28,
            background: "white",
            borderRadius: 16,
            padding: "14px 22px",
            boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
            border: "1px solid rgba(0,0,0,0.05)",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 11, fontWeight: 600, color: "#AEAEB2", letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 3px" }}>
            Bienvenidos de nuevo
          </p>
          <p style={{ fontSize: 14, fontWeight: 500, color: "#3A3A3C", margin: 0, letterSpacing: "0.01em" }}>
            {dateStr}
          </p>
        </motion.div>

        {/* Dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{ display: "flex", gap: 6, marginTop: 28 }}
        >
          {["#FF2D55", "#FF9500", "#34C759", "#007AFF", "#AF52DE"].map((color, i) => (
            <motion.div
              key={color}
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
              style={{ width: 6, height: 6, borderRadius: "50%", background: color }}
            />
          ))}
        </motion.div>
      </div>

      {/* Cards section */}
      <AnimatePresence>
        {showCards && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.15 }}
            style={{
              width: "100%",
              padding: "0 20px",
              paddingBottom: `calc(44px + env(safe-area-inset-bottom))`,
            }}
          >
            <p style={{
              textAlign: "center",
              fontSize: 13,
              fontWeight: 500,
              color: "#AEAEB2",
              marginBottom: 14,
              letterSpacing: "0.01em",
            }}>
              ¿Quién eres hoy?
            </p>

            <div style={{ display: "flex", gap: 12 }}>
              <ProfileCard
                name="alejandro"
                displayName="Alejandro"
                subtitle="Dev · Italia 🇮🇹"
                avatarSrc="/avatar_alejandro.png"
                accentColor="#1C1C1E"
                isLoading={loading === "alejandro"}
                onClick={() => handleSelectUser("alejandro")}
                delay={0.05}
              />
              <ProfileCard
                name="rut"
                displayName="Rut"
                subtitle="Psicóloga · TFG 📚"
                avatarSrc="/avatar_rut.png"
                accentColor="#FF2D55"
                isLoading={loading === "rut"}
                onClick={() => handleSelectUser("rut")}
                delay={0.13}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ProfileCardProps {
  name: string;
  displayName: string;
  subtitle: string;
  avatarSrc: string;
  accentColor: string;
  isLoading: boolean;
  onClick: () => void;
  delay: number;
}

function ProfileCard({ displayName, subtitle, avatarSrc, accentColor, isLoading, onClick, delay }: ProfileCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      initial={{ opacity: 0, y: 28, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 24, delay }}
      whileTap={{ scale: 0.96 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={onClick}
      disabled={!!isLoading}
      style={{
        flex: 1,
        background: hovered ? "white" : "white",
        border: `1.5px solid ${hovered ? accentColor + "40" : "rgba(0,0,0,0.06)"}`,
        borderRadius: 26,
        padding: "24px 14px 28px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        cursor: "pointer",
        boxShadow: hovered
          ? `0 12px 40px rgba(0,0,0,0.10), 0 0 0 3px ${accentColor}18`
          : "0 2px 16px rgba(0,0,0,0.06)",
        transition: "box-shadow 0.25s ease, border-color 0.25s ease, transform 0.2s ease",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
      }}
    >
      {/* Avatar */}
      <motion.div
        animate={{ scale: hovered ? 1.04 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{
          width: 88,
          height: 88,
          borderRadius: "50%",
          overflow: "hidden",
          border: `3px solid ${accentColor}`,
          boxShadow: `0 0 0 4px ${accentColor}18, 0 6px 20px rgba(0,0,0,0.12)`,
          marginBottom: 14,
          background: "#F2F2F7",
          flexShrink: 0,
        }}
      >
        <img
          src={avatarSrc}
          alt={displayName}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
        />
      </motion.div>

      <span style={{
        fontSize: 19,
        fontWeight: 700,
        color: "#1C1C1E",
        letterSpacing: "-0.3px",
        fontFamily: "-apple-system, 'SF Pro Display', sans-serif",
      }}>
        {displayName}
      </span>

      <span style={{
        fontSize: 12,
        color: "#AEAEB2",
        marginTop: 4,
        fontWeight: 400,
      }}>
        {subtitle}
      </span>

      {/* Accent bar */}
      <motion.div
        animate={{ width: hovered ? 44 : 24 }}
        transition={{ duration: 0.25 }}
        style={{
          height: 3,
          background: accentColor,
          borderRadius: 2,
          marginTop: 18,
        }}
      />

      {isLoading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          style={{
            width: 16, height: 16,
            border: `2px solid ${accentColor}33`,
            borderTopColor: accentColor,
            borderRadius: "50%",
            marginTop: 12,
          }}
        />
      )}
    </motion.button>
  );
}

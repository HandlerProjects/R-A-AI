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

        {/* LOGO */}
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 240, damping: 22 }}
          style={{ textAlign: "center", marginBottom: 10 }}
        >
          {/* The wordmark: R light + & accent + A light */}
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 0, lineHeight: 1 }}>
            <span style={{
              fontSize: "clamp(72px, 20vw, 96px)",
              fontWeight: 300,
              color: "#1C1C1E",
              letterSpacing: "-3px",
              fontFamily: "var(--font-outfit), sans-serif",
              lineHeight: 1,
            }}>
              R
            </span>
            <span style={{
              fontSize: "clamp(36px, 10vw, 48px)",
              fontWeight: 700,
              color: "#FF7A00",
              letterSpacing: "0px",
              fontFamily: "var(--font-outfit), sans-serif",
              lineHeight: 1,
              margin: "0 4px",
              alignSelf: "center",
              paddingBottom: 6,
            }}>
              &
            </span>
            <span style={{
              fontSize: "clamp(72px, 20vw, 96px)",
              fontWeight: 300,
              color: "#1C1C1E",
              letterSpacing: "-3px",
              fontFamily: "var(--font-outfit), sans-serif",
              lineHeight: 1,
            }}>
              A
            </span>
          </div>

          {/* Subtitle — names */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 6 }}
          >
            <span style={{ fontSize: 13, fontWeight: 300, color: "#6D6D72", letterSpacing: "0.12em" }}>Rut</span>
            <span style={{ fontSize: 13, lineHeight: 1 }}>🧡</span>
            <span style={{ fontSize: 13, fontWeight: 300, color: "#6D6D72", letterSpacing: "0.12em" }}>Alejandro</span>
          </motion.div>

          {/* Thin line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              height: 1,
              background: "linear-gradient(90deg, transparent, #C7C7CC 30%, #FF7A00 50%, #C7C7CC 70%, transparent)",
              borderRadius: 1,
              marginTop: 14,
              transformOrigin: "center",
            }}
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            style={{
              fontSize: 10,
              fontWeight: 400,
              color: "#AEAEB2",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              margin: "10px 0 0",
            }}
          >
            Your Personal AI
          </motion.p>
        </motion.div>

        {/* Welcome pill */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          style={{
            marginTop: 24,
            background: "white",
            borderRadius: 14,
            padding: "12px 20px",
            boxShadow: "0 2px 14px rgba(0,0,0,0.06)",
            border: "1px solid rgba(0,0,0,0.05)",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 10, fontWeight: 600, color: "#AEAEB2", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 2px" }}>
            Bienvenidos de nuevo
          </p>
          <p style={{ fontSize: 13, fontWeight: 400, color: "#3A3A3C", margin: 0 }}>
            {dateStr}
          </p>
        </motion.div>

        {/* Dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85 }}
          style={{ display: "flex", gap: 6, marginTop: 24 }}
        >
          {["#FF7A00", "#FF2D55", "#34C759", "#007AFF", "#AF52DE"].map((color, i) => (
            <motion.div
              key={color}
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
              style={{ width: 5, height: 5, borderRadius: "50%", background: color }}
            />
          ))}
        </motion.div>
      </div>

      {/* Cards */}
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
              fontSize: 12,
              fontWeight: 400,
              color: "#AEAEB2",
              marginBottom: 14,
              letterSpacing: "0.04em",
            }}>
              ¿Quién eres hoy?
            </p>

            <div style={{ display: "flex", gap: 12 }}>
              <ProfileCard
                name="alejandro"
                displayName="Alejandro"
                avatarSrc="/avatar_alejandro.png"
                accentColor="#FF7A00"
                isLoading={loading === "alejandro"}
                onClick={() => handleSelectUser("alejandro")}
                delay={0.05}
              />
              <ProfileCard
                name="rut"
                displayName="Rut"
                avatarSrc="/avatar_rut.png"
                accentColor="#FF7A00"
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
  avatarSrc: string;
  accentColor: string;
  isLoading: boolean;
  onClick: () => void;
  delay: number;
}

function ProfileCard({ displayName, avatarSrc, accentColor, isLoading, onClick, delay }: ProfileCardProps) {
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
        background: "white",
        border: `1.5px solid ${hovered ? accentColor + "35" : "rgba(0,0,0,0.06)"}`,
        borderRadius: 26,
        padding: "22px 14px 26px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        cursor: "pointer",
        boxShadow: hovered
          ? `0 12px 40px rgba(0,0,0,0.09), 0 0 0 3px ${accentColor}14`
          : "0 2px 16px rgba(0,0,0,0.06)",
        transition: "all 0.25s ease",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
      }}
    >
      {/* Avatar */}
      <motion.div
        animate={{ scale: hovered ? 1.04 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{
          width: 84,
          height: 84,
          borderRadius: "50%",
          overflow: "hidden",
          border: `2.5px solid ${accentColor}`,
          boxShadow: `0 0 0 4px ${accentColor}15, 0 6px 18px rgba(0,0,0,0.10)`,
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
        fontSize: 18,
        fontWeight: 600,
        color: "#1C1C1E",
        letterSpacing: "-0.2px",
        fontFamily: "var(--font-outfit), sans-serif",
      }}>
        {displayName}
      </span>

      <motion.div
        animate={{ width: hovered ? 40 : 20, opacity: hovered ? 1 : 0.4 }}
        transition={{ duration: 0.25 }}
        style={{ height: 2, background: accentColor, borderRadius: 1, marginTop: 16 }}
      />

      {isLoading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          style={{
            width: 15, height: 15,
            border: `2px solid ${accentColor}25`,
            borderTopColor: accentColor,
            borderRadius: "50%",
            marginTop: 10,
          }}
        />
      )}
    </motion.button>
  );
}

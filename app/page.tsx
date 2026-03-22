"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase";

export default function SplashPage() {
  const router = useRouter();
  const { setUser } = useUserStore();
  const [showCards, setShowCards] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [hoveredUser, setHoveredUser] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowCards(true), 600);
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
      position: "relative",
      width: "100%",
      height: "100dvh",
      overflow: "hidden",
      background: "#000000",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}>

      {/* Ambient glow behind logo */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.2 }}
        style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 340,
          height: 340,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Subtle grid pattern */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
        zIndex: 0,
        maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 0%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 0%, transparent 100%)",
      }} />

      {/* Bottom fade */}
      <div style={{
        position: "absolute",
        bottom: 0, left: 0, right: 0,
        height: "45%",
        background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 100%)",
        zIndex: 1,
        pointerEvents: "none",
      }} />

      {/* Content */}
      <div style={{
        position: "relative",
        zIndex: 10,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "env(safe-area-inset-top)",
      }}>

        {/* Logo block */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingBottom: 20 }}>

          {/* R&A wordmark */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
            style={{ position: "relative", textAlign: "center" }}
          >
            {/* Glow behind text */}
            <div style={{
              position: "absolute",
              inset: "-20px -40px",
              background: "radial-gradient(ellipse, rgba(255,255,255,0.08) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />

            <h1 style={{
              fontSize: "clamp(88px, 25vw, 120px)",
              fontWeight: 900,
              color: "white",
              letterSpacing: "-4px",
              lineHeight: 0.9,
              margin: 0,
              fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
              position: "relative",
            }}>
              R&A
            </h1>

            {/* Underline */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                height: 2,
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
                borderRadius: 1,
                marginTop: 8,
                transformOrigin: "center",
              }}
            />

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "rgba(255,255,255,0.35)",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                margin: "16px 0 0",
              }}
            >
              Your Personal AI
            </motion.p>
          </motion.div>

          {/* Floating dots decoration */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            style={{ display: "flex", gap: 6, marginTop: 32 }}
          >
            {["#FF2D55", "#FF9500", "#34C759", "#007AFF", "#AF52DE"].map((color, i) => (
              <motion.div
                key={color}
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                style={{ width: 6, height: 6, borderRadius: "50%", background: color, opacity: 0.8 }}
              />
            ))}
          </motion.div>
        </div>

        {/* User Cards */}
        <AnimatePresence>
          {showCards && (
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 28, delay: 0.1 }}
              style={{
                width: "100%",
                padding: "0 20px",
                paddingBottom: `calc(40px + env(safe-area-inset-bottom))`,
              }}
            >
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{
                  textAlign: "center",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.35)",
                  marginBottom: 16,
                  letterSpacing: "0.05em",
                }}
              >
                ¿Quién eres hoy?
              </motion.p>

              <div style={{ display: "flex", gap: 12 }}>
                <ProfileCard
                  name="alejandro"
                  displayName="Alejandro"
                  subtitle="Dev · Italia 🇮🇹"
                  avatarSrc="/avatar_alejandro.png"
                  accentColor="#ffffff"
                  bgColor="rgba(255,255,255,0.06)"
                  isLoading={loading === "alejandro"}
                  isHovered={hoveredUser === "alejandro"}
                  onHover={setHoveredUser}
                  onClick={() => handleSelectUser("alejandro")}
                  delay={0.1}
                />
                <ProfileCard
                  name="rut"
                  displayName="Rut"
                  subtitle="Psicóloga · TFG 📚"
                  avatarSrc="/avatar_rut.png"
                  accentColor="#FF2D55"
                  bgColor="rgba(255,45,85,0.08)"
                  isLoading={loading === "rut"}
                  isHovered={hoveredUser === "rut"}
                  onHover={setHoveredUser}
                  onClick={() => handleSelectUser("rut")}
                  delay={0.18}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface ProfileCardProps {
  name: string;
  displayName: string;
  subtitle: string;
  avatarSrc: string;
  accentColor: string;
  bgColor: string;
  isLoading: boolean;
  isHovered: boolean;
  onHover: (name: string | null) => void;
  onClick: () => void;
  delay: number;
}

function ProfileCard({ name, displayName, subtitle, avatarSrc, accentColor, bgColor, isLoading, isHovered, onHover, onClick, delay }: ProfileCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 32, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 24, delay }}
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => onHover(name)}
      onHoverEnd={() => onHover(null)}
      onClick={onClick}
      disabled={!!isLoading}
      style={{
        flex: 1,
        background: isHovered ? "rgba(255,255,255,0.1)" : bgColor,
        border: `1px solid ${isHovered ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)"}`,
        borderRadius: 28,
        padding: "24px 16px 28px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0,
        cursor: "pointer",
        transition: "background 0.3s ease, border-color 0.3s ease",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: isHovered
          ? "0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)"
          : "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {/* Avatar */}
      <motion.div
        animate={{ scale: isHovered ? 1.05 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{
          width: 100,
          height: 100,
          borderRadius: "50%",
          overflow: "hidden",
          border: `2.5px solid ${accentColor}`,
          boxShadow: `0 0 0 4px ${accentColor}22, 0 8px 24px rgba(0,0,0,0.4)`,
          marginBottom: 16,
          background: "#1a1a1a",
          flexShrink: 0,
        }}
      >
        <img
          src={avatarSrc}
          alt={displayName}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
        />
      </motion.div>

      {/* Name */}
      <span style={{
        fontSize: 20,
        fontWeight: 700,
        color: "white",
        letterSpacing: "-0.3px",
        lineHeight: 1.2,
        fontFamily: "-apple-system, 'SF Pro Display', sans-serif",
      }}>
        {displayName}
      </span>

      {/* Subtitle */}
      <span style={{
        fontSize: 12,
        color: "rgba(255,255,255,0.4)",
        marginTop: 5,
        fontWeight: 400,
      }}>
        {subtitle}
      </span>

      {/* Accent line */}
      <motion.div
        animate={{ width: isHovered ? 48 : 28, opacity: isHovered ? 1 : 0.5 }}
        transition={{ duration: 0.3 }}
        style={{
          height: 2.5,
          background: accentColor,
          borderRadius: 2,
          marginTop: 20,
        }}
      />

      {isLoading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          style={{
            width: 16, height: 16,
            border: "2px solid rgba(255,255,255,0.2)",
            borderTopColor: "white",
            borderRadius: "50%",
            marginTop: 12,
          }}
        />
      )}
    </motion.button>
  );
}

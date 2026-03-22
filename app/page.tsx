"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

export default function SplashPage() {
  const router = useRouter();
  const { setUser } = useUserStore();
  const [showCards, setShowCards] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowCards(true), 800);
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
    <div style={{ position: "relative", width: "100%", height: "100dvh", overflow: "hidden", background: "#0a0a0a" }}>
      {/* Background */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "url(/RA_logo_final.png)",
        backgroundSize: "cover", backgroundPosition: "center top",
      }} />
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.05) 35%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.92) 100%)",
      }} />

      <div style={{ position: "relative", zIndex: 10, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "env(safe-area-inset-top)" }}>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ paddingTop: 52, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
        >
          <h1 style={{ fontSize: 56, fontWeight: 800, color: "white", letterSpacing: "-2px", lineHeight: 1, margin: 0, fontFamily: "-apple-system, 'SF Pro Display', sans-serif", textShadow: "0 2px 24px rgba(0,0,0,0.4)" }}>
            R&A
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.65)", letterSpacing: "0.18em", textTransform: "uppercase", margin: 0 }}
          >
            Your Personal AI
          </motion.p>
        </motion.div>

        <div style={{ flex: 1 }} />

        {/* User cards */}
        <AnimatePresence>
          {showCards && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ width: "100%", padding: "0 24px", paddingBottom: `calc(48px + env(safe-area-inset-bottom))` }}
            >
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{ textAlign: "center", fontSize: 15, fontWeight: 500, color: "rgba(255,255,255,0.6)", marginBottom: 20, letterSpacing: "0.01em" }}
              >
                ¿Quién eres hoy?
              </motion.p>

              <div style={{ display: "flex", gap: 14 }}>
                <UserProfileCard
                  name="alejandro"
                  displayName="Alejandro"
                  subtitle="Dev · Italia 🇮🇹"
                  avatarSrc="/avatar_alejandro.png"
                  avatarColor="#1C1C1E"
                  accentColor="#1C1C1E"
                  isLoading={loading === "alejandro"}
                  onClick={() => handleSelectUser("alejandro")}
                  delay={0.05}
                />
                <UserProfileCard
                  name="rut"
                  displayName="Rut"
                  subtitle="Psicóloga · TFG 📚"
                  avatarSrc="/avatar_rut.png"
                  avatarColor="#FF2D55"
                  accentColor="#FF2D55"
                  isLoading={loading === "rut"}
                  onClick={() => handleSelectUser("rut")}
                  delay={0.15}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface UserProfileCardProps {
  name: string;
  displayName: string;
  subtitle: string;
  avatarSrc: string;
  avatarColor: string;
  accentColor: string;
  isLoading: boolean;
  onClick: () => void;
  delay: number;
}

function UserProfileCard({ displayName, subtitle, avatarSrc, avatarColor, accentColor, isLoading, onClick, delay }: UserProfileCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 40, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 22, delay }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      disabled={isLoading}
      style={{
        flex: 1,
        background: "rgba(255,255,255,0.12)",
        backdropFilter: "blur(32px) saturate(180%)",
        WebkitBackdropFilter: "blur(32px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.22)",
        borderRadius: 28,
        padding: "20px 16px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0,
        cursor: "pointer",
        overflow: "hidden",
        boxShadow: "0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
      }}
    >
      {/* Avatar image or letter fallback */}
      <div style={{
        width: 96, height: 96, borderRadius: "50%",
        overflow: "hidden",
        border: `3px solid ${accentColor}`,
        boxShadow: `0 4px 20px ${accentColor}55, 0 0 0 4px rgba(255,255,255,0.1)`,
        marginBottom: 14,
        background: avatarColor,
        flexShrink: 0,
      }}>
        <img
          src={avatarSrc}
          alt={displayName}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>

      <span style={{ fontSize: 18, fontWeight: 700, color: "white", letterSpacing: "-0.3px", lineHeight: 1.2 }}>
        {displayName}
      </span>
      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 4, fontWeight: 400 }}>
        {subtitle}
      </span>

      {/* Accent bar */}
      <div style={{
        width: 32, height: 3, borderRadius: 2,
        background: accentColor,
        marginTop: 16,
        opacity: 0.8,
      }} />
    </motion.button>
  );
}

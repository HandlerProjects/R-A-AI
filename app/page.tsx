"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { UserCard } from "@/components/UserCard";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase";

export default function SplashPage() {
  const router = useRouter();
  const { setUser } = useUserStore();
  const [showCards, setShowCards] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // After splash animation, show user cards
    const timer = setTimeout(() => setShowCards(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleSelectUser = async (name: "alejandro" | "rut") => {
    if (loading) return;
    setLoading(true);

    try {
      const { data } = await supabase
        .from("users")
        .select("id")
        .eq("name", name)
        .single();

      const userId = data?.id ?? name; // fallback to name if no DB yet
      setUser(name, userId);
      router.push(`/${name}`);
    } catch {
      // Even without DB, allow navigation
      setUser(name, name);
      router.push(`/${name}`);
    }
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100dvh",
        overflow: "hidden",
        background: "#0a0a0a",
      }}
    >
      {/* Background image */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url(/RA_logo_final.png)",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.75) 100%)",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        {/* Logo area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
          style={{
            paddingTop: 56,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
          }}
        >
          <h1
            style={{
              fontSize: 52,
              fontWeight: 800,
              color: "white",
              fontFamily: "var(--font-display)",
              letterSpacing: "-1px",
              lineHeight: 1,
              margin: 0,
              textShadow: "0 2px 20px rgba(0,0,0,0.5)",
            }}
          >
            R&A
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "rgba(255,255,255,0.8)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            Your Personal AI
          </motion.p>
        </motion.div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* User selection */}
        <AnimatePresence>
          {showCards && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                width: "100%",
                padding: "0 20px",
                paddingBottom: `calc(40px + env(safe-area-inset-bottom))`,
              }}
            >
              {/* Label */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                style={{
                  textAlign: "center",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.7)",
                  marginBottom: 16,
                  letterSpacing: "0.02em",
                }}
              >
                ¿Quién eres hoy?
              </motion.p>

              {/* Cards row */}
              <div
                style={{
                  display: "flex",
                  gap: 16,
                }}
              >
                <UserCard
                  name="alejandro"
                  subtitle="Desarrollador · Italia 🇮🇹"
                  avatarColor="#1D1D1F"
                  avatarLetter="A"
                  onClick={() => handleSelectUser("alejandro")}
                  delay={0.05}
                />
                <UserCard
                  name="rut"
                  subtitle="Psicóloga · TFG 2026 📚"
                  avatarColor="#FF2D55"
                  avatarLetter="R"
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

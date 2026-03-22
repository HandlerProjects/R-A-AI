"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useUserStore, UserName } from "@/store/userStore";
import { useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { activeUser, setUser, clearUser } = useUserStore();
  const userParam = params.user as UserName;

  useEffect(() => {
    if (userParam && userParam !== activeUser) {
      setUser(userParam, userParam);
    }
  }, [userParam, activeUser, setUser]);

  const isAlejandro = userParam === "alejandro";
  const displayName = isAlejandro ? "Alejandro" : "Rut";
  const avatarColor = isAlejandro ? "#1D1D1F" : "#FF2D55";
  const subtitle = isAlejandro ? "Desarrollador · MBL Studio" : "Psicóloga · TFG 2026";

  const handleSwitchUser = () => {
    clearUser();
    router.push("/");
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
      <div
        style={{
          padding: "20px 20px 0",
          paddingTop: `calc(20px + env(safe-area-inset-top))`,
          flexShrink: 0,
        }}
      >
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "white",
            margin: 0,
            fontFamily: "var(--font-display)",
          }}
        >
          Perfil
        </h1>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "32px 20px 100px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        {/* Avatar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: avatarColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "3px solid rgba(255,255,255,0.15)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <span style={{ fontSize: 44, fontWeight: 700, color: "white" }}>
            {displayName[0]}
          </span>
        </motion.div>

        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "white", margin: 0 }}>
            {displayName}
          </h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>
            {subtitle}
          </p>
        </div>

        {/* App info */}
        <div
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: 20,
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 16,
            }}
          >
            App
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <InfoRow label="Versión" value="2.0" />
            <InfoRow label="Modelo" value="Claude Sonnet 4.6" />
            <InfoRow label="Usuario" value={displayName} />
            <InfoRow label="MBL Studio" value="2026" />
          </div>
        </div>

        {/* Switch user button */}
        <button
          onClick={handleSwitchUser}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 16,
            background: "rgba(255,45,85,0.1)",
            border: "1px solid rgba(255,45,85,0.25)",
            color: "#FF2D55",
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <span>⇄</span>
          Cambiar usuario
        </button>
      </div>

      <BottomNav />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 14, color: "rgba(255,255,255,0.45)" }}>{label}</span>
      <span style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}

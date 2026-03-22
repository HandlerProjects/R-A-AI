"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ModuleCard } from "@/components/ModuleCard";
import { BottomNav } from "@/components/BottomNav";
import { useUserStore, UserName } from "@/store/userStore";

const ALEJANDRO_MODULES = [
  { id: "outfits", icon: "👔", title: "Outfits", description: "Armario, visor 360, botón dado" },
  { id: "comidas", icon: "🥗", title: "Comidas", description: "Nutrición y recetas para ganar masa" },
  { id: "posts", icon: "📱", title: "Posts", description: "Instagram y LinkedIn en tu voz" },
  { id: "psicologo", icon: "🧘", title: "Psicólogo", description: "Tu espacio privado de reflexión" },
  { id: "prompts", icon: "✍️", title: "Prompts", description: "Para Claude, Midjourney, Runway..." },
  { id: "automatizaciones", icon: "⚙️", title: "Automatizaciones", description: "n8n y tareas cotidianas" },
  { id: "proyectos", icon: "🚀", title: "Proyectos", description: "APISA, Autoescuela, SOLØN, MBL" },
];

const RUT_MODULES = [
  { id: "tfg", icon: "🎓", title: "TFG Psicología", description: "Redacción, APA, bibliografía, análisis" },
  { id: "estudios", icon: "📚", title: "Estudios", description: "Resúmenes, esquemas, preparación exámenes" },
  { id: "psicologo", icon: "🧘", title: "Psicólogo", description: "Tu espacio privado de reflexión" },
  { id: "prompts", icon: "✍️", title: "Prompts", description: "Adaptado a tus necesidades académicas" },
  { id: "posts", icon: "📱", title: "Posts", description: "Contenido propio si lo necesitas" },
];

const SHARED_MODULES = [
  { id: "plans", icon: "💑", title: "Planes de pareja", description: "Ideas, historial conjunto, sorpresas" },
  { id: "italian", icon: "🇮🇹", title: "Italiano", description: "Aprended juntos o por separado" },
  { id: "chat", icon: "💬", title: "Chat libre R&A", description: "IA con contexto de los dos" },
];

export default function HomePage() {
  const params = useParams();
  const router = useRouter();
  const { activeUser, setUser } = useUserStore();
  const userParam = params.user as UserName;

  useEffect(() => {
    // Sync URL param with store
    if (userParam && userParam !== activeUser) {
      setUser(userParam, userParam);
    }
  }, [userParam, activeUser, setUser]);

  const isAlejandro = userParam === "alejandro";
  const displayName = isAlejandro ? "Alejandro" : "Rut";
  const greeting = getGreeting();
  const ownModules = isAlejandro ? ALEJANDRO_MODULES : RUT_MODULES;

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
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          padding: "20px 20px 0",
          paddingTop: `calc(20px + env(safe-area-inset-top))`,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: 0 }}>
              {greeting}
            </p>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "white",
                margin: "2px 0 0",
                fontFamily: "var(--font-display)",
              }}
            >
              {displayName}
            </h1>
          </div>
          {/* Avatar */}
          <button
            onClick={() => router.push("/")}
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              background: isAlejandro ? "#1D1D1F" : "#FF2D55",
              border: "2px solid rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: 18,
              fontWeight: 700,
              color: "white",
            }}
          >
            {isAlejandro ? "A" : "R"}
          </button>
        </div>

        {/* R&A badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginTop: 12,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            padding: "5px 12px",
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#30D158",
            }}
          />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>
            R&A activo
          </span>
        </div>
      </motion.div>

      {/* Scrollable content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 20px 80px",
        }}
      >
        {/* Own modules */}
        <section style={{ marginBottom: 28 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "rgba(255,255,255,0.35)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 12,
            }}
          >
            Tus módulos
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            {ownModules.map((mod, i) => (
              <ModuleCard
                key={mod.id}
                id={mod.id}
                icon={mod.icon}
                title={mod.title}
                description={mod.description}
                delay={i * 0.04}
              />
            ))}
          </div>
        </section>

        {/* Shared modules */}
        <section>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "rgba(255,255,255,0.35)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 12,
            }}
          >
            Compartidos
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {SHARED_MODULES.map((mod, i) => (
              <ModuleCard
                key={mod.id}
                id={mod.id}
                icon={mod.icon}
                title={mod.title}
                description={mod.description}
                delay={0.15 + i * 0.04}
                shared
              />
            ))}
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return "Buenas noches";
  if (hour < 14) return "Buenos días";
  if (hour < 21) return "Buenas tardes";
  return "Buenas noches";
}

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore, UserName } from "@/store/userStore";
import { loadHucha, addContribucion, type HuchaStats } from "@/lib/hucha";

const DOG_COLOR = "#C8894A";

function DachshundSVG({ bounce }: { bounce: boolean }) {
  return (
    <motion.div
      animate={bounce ? { scale: [1, 1.08, 0.95, 1.03, 1], rotate: [0, -3, 3, -1, 0] } : {}}
      transition={{ duration: 0.5 }}
      style={{ display: "flex", justifyContent: "center" }}
    >
      <svg viewBox="0 0 320 210" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", maxWidth: 260 }}>
        {/* Ear floppy */}
        <ellipse cx="70" cy="122" rx="15" ry="30" fill={DOG_COLOR} transform="rotate(-10 70 122)" opacity="0.85" />
        {/* Body */}
        <ellipse cx="175" cy="130" rx="115" ry="42" fill={DOG_COLOR} />
        {/* Neck bridge */}
        <ellipse cx="82" cy="114" rx="26" ry="22" fill={DOG_COLOR} />
        {/* Head */}
        <ellipse cx="52" cy="90" rx="35" ry="30" fill={DOG_COLOR} />
        {/* Snout */}
        <ellipse cx="20" cy="104" rx="18" ry="13" fill={DOG_COLOR} />
        {/* Coin slot */}
        <rect x="148" y="90" width="44" height="9" rx="4.5" fill="rgba(0,0,0,0.5)" />
        {/* Eye */}
        <circle cx="40" cy="83" r="5" fill="rgba(0,0,0,0.4)" />
        {/* Nostril */}
        <circle cx="8" cy="108" r="4" fill="rgba(0,0,0,0.35)" />
        {/* Front legs */}
        <rect x="102" y="166" width="18" height="36" rx="9" fill={DOG_COLOR} />
        <rect x="126" y="166" width="18" height="36" rx="9" fill={DOG_COLOR} />
        {/* Back legs */}
        <rect x="222" y="166" width="18" height="36" rx="9" fill={DOG_COLOR} />
        <rect x="246" y="166" width="18" height="36" rx="9" fill={DOG_COLOR} />
        {/* Tail curled up */}
        <path d="M 285 122 C 308 112 318 88 306 72 C 295 58 278 68 284 80"
          stroke={DOG_COLOR} strokeWidth="14" strokeLinecap="round" fill="none" />
      </svg>
    </motion.div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora mismo";
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ayer";
  return `hace ${days} días`;
}

export default function HuchaPage() {
  const params = useParams();
  const router = useRouter();
  const { activeUser, setUser } = useUserStore();
  const userParam = params.user as UserName;

  useEffect(() => {
    if (userParam && userParam !== activeUser) setUser(userParam, userParam);
  }, [userParam, activeUser, setUser]);

  const [stats, setStats] = useState<HuchaStats>({ total: 0, totalRut: 0, totalAlejandro: 0, entries: [] });
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [bounce, setBounce] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [floatingCoins, setFloatingCoins] = useState<{ id: number; x: number }[]>([]);

  useEffect(() => {
    loadHucha().then((s) => { setStats(s); setLoading(false); });
  }, []);

  const handleAdd = async (userName: string) => {
    if (adding) return;
    setAdding(userName);

    const coins = Array.from({ length: 3 }, (_, i) => ({ id: Date.now() + i, x: 25 + Math.random() * 50 }));
    setFloatingCoins((p) => [...p, ...coins]);
    setTimeout(() => setFloatingCoins((p) => p.filter((c) => !coins.find((n) => n.id === c.id))), 1500);

    const entry = await addContribucion(userName);
    if (entry) {
      setStats((prev) => ({
        total: prev.total + 1,
        totalRut: userName === "rut" ? prev.totalRut + 1 : prev.totalRut,
        totalAlejandro: userName === "alejandro" ? prev.totalAlejandro + 1 : prev.totalAlejandro,
        entries: [entry, ...prev.entries],
      }));
      setBounce(true);
      setTimeout(() => setBounce(false), 600);
      setToast(userName === "rut" ? "🐾 ¡Rut puso 1€!" : "🐾 ¡Alejandro puso 1€!");
      setTimeout(() => setToast(null), 2500);
    }
    setAdding(null);
  };

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg-primary)", overflow: "hidden" }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        style={{
          padding: "14px 20px", paddingTop: `calc(14px + env(safe-area-inset-top))`,
          background: "rgba(242,242,247,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)", flexShrink: 0, zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => router.back()}
            style={{ background: "rgba(0,0,0,0.06)", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="#1C1C1E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.3px" }}>Hucha 🐶</h1>
            <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0 }}>Cada piropo negado, 1€</p>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", paddingBottom: "100px" }}>

        {/* Dachshund card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{
            background: "white", borderRadius: 24, padding: "24px 20px 22px",
            marginBottom: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            border: "1px solid rgba(0,0,0,0.05)", position: "relative", overflow: "hidden",
          }}
        >
          {/* Floating coins */}
          <AnimatePresence>
            {floatingCoins.map((c) => (
              <motion.span
                key={c.id}
                initial={{ opacity: 1, y: 0, scale: 1 }}
                animate={{ opacity: 0, y: -80, scale: 1.4 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                style={{ position: "absolute", top: "50%", left: `${c.x}%`, fontSize: 22, zIndex: 20, pointerEvents: "none" }}
              >🪙</motion.span>
            ))}
          </AnimatePresence>

          {/* Toast */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{
                  position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)",
                  background: "#1C1C1E", borderRadius: 20, padding: "7px 16px",
                  fontSize: 13, fontWeight: 700, color: "white",
                  whiteSpace: "nowrap", zIndex: 30, boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                }}
              >{toast}</motion.div>
            )}
          </AnimatePresence>

          <DachshundSVG bounce={bounce} />

          <div style={{ textAlign: "center", marginTop: 14 }}>
            <motion.p
              key={stats.total}
              initial={{ scale: 1.25 }} animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              style={{ fontSize: 56, fontWeight: 800, color: "#1C1C1E", margin: 0, letterSpacing: "-2px", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}
            >
              {loading ? "—" : `€${stats.total}`}
            </motion.p>
            <p style={{ fontSize: 13, color: "rgba(0,0,0,0.38)", margin: "4px 0 18px", fontWeight: 500 }}>
              ahorrados juntos
            </p>

            {/* Individual stats */}
            <div style={{ display: "flex", justifyContent: "center", gap: 24, alignItems: "center" }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 24, fontWeight: 800, color: "#FF2D55", margin: 0 }}>€{stats.totalRut}</p>
                <p style={{ fontSize: 11, color: "rgba(0,0,0,0.38)", margin: "2px 0 0", fontWeight: 600 }}>Rut</p>
              </div>
              <div style={{ width: 1, height: 36, background: "rgba(0,0,0,0.08)" }} />
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 24, fontWeight: 800, color: "#1C1C1E", margin: 0 }}>€{stats.totalAlejandro}</p>
                <p style={{ fontSize: 11, color: "rgba(0,0,0,0.38)", margin: "2px 0 0", fontWeight: 600 }}>Alejandro</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Buttons card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          style={{ background: "white", borderRadius: 20, padding: "18px 16px", marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.05)" }}
        >
          <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(0,0,0,0.32)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 14px", textAlign: "center" }}>
            ¿Alguien negó un piropo?
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => handleAdd("rut")}
              disabled={!!adding}
              style={{
                flex: 1, padding: "16px 8px",
                background: adding === "rut" ? "rgba(255,45,85,0.08)" : "linear-gradient(135deg, #FF2D55, #FF6B8A)",
                border: "none", borderRadius: 16, cursor: adding ? "default" : "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                boxShadow: adding === "rut" ? "none" : "0 4px 14px rgba(255,45,85,0.3)",
                transition: "all 0.2s",
              }}
            >
              <span style={{ fontSize: 22 }}>{adding === "rut" ? "⏳" : "🪙"}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: adding === "rut" ? "#FF2D55" : "white" }}>
                +1€ Rut
              </span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => handleAdd("alejandro")}
              disabled={!!adding}
              style={{
                flex: 1, padding: "16px 8px",
                background: adding === "alejandro" ? "rgba(28,28,30,0.07)" : "linear-gradient(135deg, #1C1C1E, #3A3A3C)",
                border: "none", borderRadius: 16, cursor: adding ? "default" : "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                boxShadow: adding === "alejandro" ? "none" : "0 4px 14px rgba(0,0,0,0.22)",
                transition: "all 0.2s",
              }}
            >
              <span style={{ fontSize: 22 }}>{adding === "alejandro" ? "⏳" : "🪙"}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: adding === "alejandro" ? "#1C1C1E" : "white" }}>
                +1€ Alejandro
              </span>
            </motion.button>
          </div>
        </motion.div>

        {/* History */}
        <AnimatePresence>
          {!loading && stats.entries.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-quaternary)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 10 }}>
                Últimas contribuciones
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {stats.entries.map((e, i) => (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.04 }}
                    style={{
                      background: "white", borderRadius: 14, padding: "12px 16px",
                      display: "flex", alignItems: "center", gap: 12,
                      boxShadow: "0 1px 6px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.04)",
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{e.user_name === "rut" ? "💗" : "🖤"}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                        {e.user_name === "rut" ? "Rut" : "Alejandro"} añadió 1€
                      </p>
                      <p style={{ fontSize: 11, color: "var(--text-quaternary)", margin: "2px 0 0" }}>
                        {timeAgo(e.created_at)}
                      </p>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#34C759" }}>+€1</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom nav */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(242,242,247,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(0,0,0,0.08)",
        display: "flex", justifyContent: "space-around", alignItems: "center",
        paddingBottom: "env(safe-area-inset-bottom)", paddingTop: 8, zIndex: 100,
      }}>
        {[
          { icon: "⊞", label: "Inicio", href: `/${userParam}` },
          { icon: "💬", label: "Chat", href: `/${userParam}/chat` },
          { icon: "👤", label: "Perfil", href: `/${userParam}/profile` },
        ].map((item) => (
          <button key={item.href} onClick={() => router.push(item.href)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 20px", background: "none", border: "none", cursor: "pointer", opacity: 0.6 }}
          >
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 500, color: "var(--text-primary)" }}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

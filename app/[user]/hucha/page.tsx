"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore, UserName } from "@/store/userStore";
import { loadHucha, addContribucion, type HuchaStats } from "@/lib/hucha";

// ─── SVG Perro Salchicha Cerámica ─────────────────────────────────────────────
function DachshundSVG({ jiggle }: { jiggle: boolean }) {
  return (
    <motion.div
      animate={jiggle ? { rotate: [-4, 4, -3, 3, -1, 0], y: [0, -5, 0] } : {}}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{ display: "flex", justifyContent: "center", width: "100%" }}
    >
      <svg
        viewBox="0 0 300 195"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", maxWidth: 260 }}
      >
        <defs>
          <linearGradient id="hbrown" x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#9B4E1F" />
            <stop offset="100%" stopColor="#4A1E06" />
          </linearGradient>
          <linearGradient id="hbrown2" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor="#8B4419" />
            <stop offset="100%" stopColor="#4A1E06" />
          </linearGradient>
          <radialGradient id="bodyshine" cx="40%" cy="30%" r="60%">
            <stop offset="0%" stopColor="#B5622A" />
            <stop offset="100%" stopColor="#4A1E06" />
          </radialGradient>
          <radialGradient id="headshine" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#A85824" />
            <stop offset="100%" stopColor="#4A1E06" />
          </radialGradient>
        </defs>

        {/* Oreja (detrás de la cabeza, larga y caída) */}
        <ellipse cx="83" cy="126" rx="19" ry="38"
          fill="url(#hbrown2)" transform="rotate(-10 83 126)" />

        {/* Cuerpo — grande y redondo */}
        <ellipse cx="178" cy="126" rx="100" ry="55" fill="url(#bodyshine)" />

        {/* Unión cuello-cuerpo */}
        <ellipse cx="107" cy="112" rx="35" ry="32" fill="url(#headshine)" />

        {/* Cabeza — grande y redonda */}
        <ellipse cx="66" cy="90" rx="50" ry="44" fill="url(#headshine)" />

        {/* Hocico superior */}
        <ellipse cx="24" cy="100" rx="26" ry="18" fill="url(#hbrown2)" />

        {/* Mandíbula inferior */}
        <ellipse cx="22" cy="113" rx="21" ry="12" fill="#3D1804" opacity="0.8" />

        {/* ── Brillo cerámica (cuerpo) */}
        <ellipse cx="148" cy="92" rx="65" ry="24"
          fill="white" opacity="0.13" transform="rotate(-14 148 92)" />

        {/* ── Brillo cerámica (cabeza) */}
        <ellipse cx="52" cy="72" rx="24" ry="15"
          fill="white" opacity="0.22" transform="rotate(-22 52 72)" />

        {/* Ranura monedas */}
        <rect x="143" y="74" width="54" height="13" rx="6.5" fill="rgba(0,0,0,0.7)" />
        <rect x="145" y="76" width="50" height="5" rx="2.5" fill="rgba(0,0,0,0.35)" />
        {/* Brillo ranura */}
        <rect x="147" y="77" width="22" height="2" rx="1" fill="rgba(255,255,255,0.08)" />

        {/* Ojo */}
        <circle cx="48" cy="83" r="10" fill="#0F0400" />
        <circle cx="51" cy="79" r="4" fill="white" opacity="0.72" />
        <circle cx="50" cy="81" r="1.5" fill="white" opacity="0.9" />

        {/* Nariz */}
        <ellipse cx="5" cy="104" rx="8" ry="7" fill="#0F0400" />
        <ellipse cx="6" cy="101" rx="3.5" ry="2.5" fill="white" opacity="0.3" />

        {/* Patas delanteras — cortas y redondeadas */}
        <rect x="113" y="172" width="26" height="21" rx="13" fill="url(#hbrown2)" />
        <rect x="145" y="172" width="26" height="21" rx="13" fill="url(#hbrown2)" />

        {/* Patas traseras */}
        <rect x="226" y="172" width="26" height="21" rx="13" fill="url(#hbrown2)" />
        <rect x="255" y="172" width="24" height="21" rx="12" fill="url(#hbrown2)" />

        {/* Brillos patas */}
        <rect x="115" y="174" width="10" height="9" rx="4.5" fill="white" opacity="0.13" />
        <rect x="147" y="174" width="10" height="9" rx="4.5" fill="white" opacity="0.13" />
        <rect x="228" y="174" width="10" height="9" rx="4.5" fill="white" opacity="0.13" />
        <rect x="257" y="174" width="9" height="9" rx="4.5" fill="white" opacity="0.13" />

        {/* Cola — curva hacia arriba */}
        <path d="M 272 126 C 292 116 302 94 290 78 C 280 65 264 72 270 84"
          stroke="url(#hbrown)" strokeWidth="17" strokeLinecap="round" fill="none" />
        {/* Brillo cola */}
        <path d="M 274 122 C 290 113 298 94 288 80"
          stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.12" />
      </svg>
    </motion.div>
  );
}

// ─── Animación moneda cayendo ──────────────────────────────────────────────────
// La ranura está en viewBox ~x=170, y=80 → ~57% horizontal, ~41% vertical del SVG
function CoinDrop({ id, onDone }: { id: number; onDone: (id: number) => void }) {
  return (
    <motion.div
      key={id}
      initial={{ y: -55, scale: 1.1, opacity: 1, rotate: -15 }}
      animate={{ y: 0, scale: 0.05, opacity: 0, rotate: 15 }}
      transition={{ duration: 0.48, ease: [0.55, 0, 1, 0.45] }}
      onAnimationComplete={() => onDone(id)}
      style={{
        position: "absolute",
        top: "41%",
        left: "57%",
        transform: "translateX(-50%)",
        fontSize: 30,
        pointerEvents: "none",
        zIndex: 30,
      }}
    >
      🪙
    </motion.div>
  );
}

// ─── Tiempo relativo ───────────────────────────────────────────────────────────
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

// ─── Página principal ──────────────────────────────────────────────────────────
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
  const [jiggle, setJiggle] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [coins, setCoins] = useState<number[]>([]);

  useEffect(() => {
    loadHucha().then((s) => { setStats(s); setLoading(false); });
  }, []);

  const removeCoin = (id: number) => setCoins((p) => p.filter((c) => c !== id));

  const handleAdd = async (userName: string) => {
    if (adding) return;
    setAdding(userName);

    // Lanzar moneda
    const coinId = Date.now();
    setCoins((p) => [...p, coinId]);

    // Perrillo se mueve cuando la moneda llega
    setTimeout(() => {
      setJiggle(true);
      setTimeout(() => setJiggle(false), 550);
    }, 420);

    const entry = await addContribucion(userName);
    if (entry) {
      setStats((prev) => ({
        total: prev.total + 1,
        totalRut: userName === "rut" ? prev.totalRut + 1 : prev.totalRut,
        totalAlejandro: userName === "alejandro" ? prev.totalAlejandro + 1 : prev.totalAlejandro,
        entries: [entry, ...prev.entries],
      }));
      setToast(userName === "rut" ? "🐾 Rut negó un piropo · +1€" : "🐾 Alejandro negó un piropo · +1€");
      setTimeout(() => setToast(null), 2800);
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

      {/* Contenido */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", paddingBottom: "100px" }}>

        {/* Tarjeta principal — perro + contador */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{
            background: "white", borderRadius: 28, padding: "28px 20px 24px",
            marginBottom: 14, boxShadow: "0 6px 28px rgba(0,0,0,0.09)",
            border: "1px solid rgba(0,0,0,0.05)", position: "relative", overflow: "hidden",
          }}
        >
          {/* Toast */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8 }}
                style={{
                  position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)",
                  background: "#1C1C1E", borderRadius: 22, padding: "8px 18px",
                  fontSize: 13, fontWeight: 700, color: "white",
                  whiteSpace: "nowrap", zIndex: 40, boxShadow: "0 4px 18px rgba(0,0,0,0.22)",
                }}
              >{toast}</motion.div>
            )}
          </AnimatePresence>

          {/* Zona del SVG con monedas animadas */}
          <div style={{ position: "relative" }}>
            <DachshundSVG jiggle={jiggle} />
            {/* Monedas cayendo — posicionadas relativas al SVG */}
            <AnimatePresence>
              {coins.map((id) => (
                <CoinDrop key={id} id={id} onDone={removeCoin} />
              ))}
            </AnimatePresence>
          </div>

          {/* Total */}
          <div style={{ textAlign: "center", marginTop: 10 }}>
            <motion.p
              key={stats.total}
              initial={{ scale: 1.35, color: "#34C759" }}
              animate={{ scale: 1, color: "#1C1C1E" }}
              transition={{ type: "spring", stiffness: 450, damping: 20 }}
              style={{ fontSize: 60, fontWeight: 900, margin: 0, letterSpacing: "-3px", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}
            >
              {loading ? "—" : `€${stats.total}`}
            </motion.p>
            <p style={{ fontSize: 13, color: "rgba(0,0,0,0.35)", margin: "5px 0 20px", fontWeight: 500 }}>
              ahorrados juntos
            </p>

            {/* Stats individuales */}
            <div style={{ display: "flex", justifyContent: "center", gap: 28, alignItems: "center" }}>
              <div style={{ textAlign: "center" }}>
                <motion.p
                  key={`rut-${stats.totalRut}`}
                  initial={{ scale: 1.3 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  style={{ fontSize: 26, fontWeight: 800, color: "#FF2D55", margin: 0 }}
                >€{stats.totalRut}</motion.p>
                <p style={{ fontSize: 11, color: "rgba(0,0,0,0.35)", margin: "2px 0 0", fontWeight: 600 }}>Rut</p>
              </div>
              <div style={{ width: 1, height: 40, background: "rgba(0,0,0,0.08)" }} />
              <div style={{ textAlign: "center" }}>
                <motion.p
                  key={`ale-${stats.totalAlejandro}`}
                  initial={{ scale: 1.3 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  style={{ fontSize: 26, fontWeight: 800, color: "#1C1C1E", margin: 0 }}
                >€{stats.totalAlejandro}</motion.p>
                <p style={{ fontSize: 11, color: "rgba(0,0,0,0.35)", margin: "2px 0 0", fontWeight: 600 }}>Alejandro</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Botones */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          style={{ background: "white", borderRadius: 22, padding: "20px 16px", marginBottom: 14, boxShadow: "0 2px 14px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.05)" }}
        >
          <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(0,0,0,0.3)", textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 14px", textAlign: "center" }}>
            ¿Alguien negó un piropo?
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { name: "rut", label: "+1€ Rut", bg: "linear-gradient(135deg,#FF2D55,#FF6B8A)", shadow: "rgba(255,45,85,0.32)" },
              { name: "alejandro", label: "+1€ Alejandro", bg: "linear-gradient(135deg,#1C1C1E,#3A3A3C)", shadow: "rgba(0,0,0,0.25)" },
            ].map(({ name, label, bg, shadow }) => (
              <motion.button
                key={name}
                whileTap={{ scale: 0.93 }}
                onClick={() => handleAdd(name)}
                disabled={!!adding}
                style={{
                  flex: 1, padding: "18px 8px",
                  background: adding === name ? "rgba(0,0,0,0.06)" : bg,
                  border: "none", borderRadius: 18, cursor: adding ? "default" : "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  boxShadow: adding === name ? "none" : `0 5px 18px ${shadow}`,
                  transition: "all 0.2s",
                }}
              >
                <motion.span
                  animate={adding === name ? { rotate: 360 } : {}}
                  transition={{ duration: 0.6, repeat: adding === name ? Infinity : 0, ease: "linear" }}
                  style={{ fontSize: 24 }}
                >
                  {adding === name ? "⏳" : "🪙"}
                </motion.span>
                <span style={{ fontSize: 15, fontWeight: 700, color: adding === name ? "rgba(0,0,0,0.35)" : "white" }}>
                  {label}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Historial */}
        <AnimatePresence>
          {!loading && stats.entries.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-quaternary)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 10 }}>
                Historial
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {stats.entries.map((e, i) => (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    style={{
                      background: "white", borderRadius: 14, padding: "12px 16px",
                      display: "flex", alignItems: "center", gap: 12,
                      boxShadow: "0 1px 6px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.04)",
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{e.user_name === "rut" ? "💗" : "🖤"}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                        {e.user_name === "rut" ? "Rut" : "Alejandro"} negó un piropo
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

        {/* Estado vacío */}
        {!loading && stats.entries.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            style={{ textAlign: "center", paddingTop: 20 }}
          >
            <p style={{ fontSize: 14, color: "var(--text-quaternary)", fontWeight: 500 }}>
              La hucha está vacía 🐶
            </p>
            <p style={{ fontSize: 12, color: "var(--text-quaternary)", opacity: 0.7 }}>
              Negad un piropo y ponéis el primer euro
            </p>
          </motion.div>
        )}
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

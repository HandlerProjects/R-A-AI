"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore, UserName } from "@/store/userStore";
import { loadHucha, addContribucion, type HuchaStats } from "@/lib/hucha";

// ─── Hucha cerámica SVG ────────────────────────────────────────────────────────
function Hucha({ jiggle }: { jiggle: boolean }) {
  return (
    <motion.div
      animate={jiggle ? { rotate: [-4, 4, -3, 3, -1.5, 1.5, 0] } : {}}
      transition={{ duration: 0.46 }}
      style={{ display: "flex", justifyContent: "center" }}
    >
      <svg viewBox="0 0 210 205" width="210" height="205" style={{ overflow: "visible" }}>
        <defs>
          {/* Cerámica principal: luz arriba-izquierda */}
          <radialGradient id="hCer" cx="30%" cy="24%" r="70%">
            <stop offset="0%"   stopColor="#FFF8E8"/>
            <stop offset="28%"  stopColor="#EDD5A0"/>
            <stop offset="65%"  stopColor="#C89850"/>
            <stop offset="100%" stopColor="#8A5E20"/>
          </radialGradient>
          {/* Lado oscuro (patas traseras, interior oreja) */}
          <radialGradient id="hDrk" cx="30%" cy="24%" r="70%">
            <stop offset="0%"   stopColor="#BF9040"/>
            <stop offset="100%" stopColor="#6A4010"/>
          </radialGradient>
          {/* Hocico */}
          <radialGradient id="hSnout" cx="38%" cy="32%" r="70%">
            <stop offset="0%"   stopColor="#DEC078"/>
            <stop offset="100%" stopColor="#9A6828"/>
          </radialGradient>
          {/* Sombra suave */}
          <filter id="hShadow" x="-25%" y="-15%" width="150%" height="160%">
            <feDropShadow dx="0" dy="10" stdDeviation="13"
              floodColor="#5A3010" floodOpacity="0.26"/>
          </filter>
        </defs>

        {/* Cola rizada (izquierda) */}
        <path d="M 30 100 Q 5 74 13 52 Q 21 30 13 16"
          stroke="#C89850" strokeWidth="9" fill="none" strokeLinecap="round"/>
        <path d="M 30 100 Q 5 74 13 52 Q 21 30 13 16"
          stroke="rgba(255,238,190,0.45)" strokeWidth="4.5" fill="none" strokeLinecap="round"/>

        {/* Patas traseras (más oscuras, detrás del cuerpo) */}
        <rect x="128" y="158" width="21" height="35" rx="10.5" fill="url(#hDrk)"/>
        <rect x="55"  y="158" width="21" height="35" rx="10.5" fill="url(#hDrk)"/>

        {/* Cuerpo principal */}
        <ellipse cx="97" cy="102" rx="76" ry="67" fill="url(#hCer)" filter="url(#hShadow)"/>

        {/* Brillo ceramica en el cuerpo */}
        <ellipse cx="67" cy="68" rx="22" ry="14"
          fill="rgba(255,255,255,0.38)" transform="rotate(-26 67 68)"/>
        {/* Segundo brillo sutil */}
        <ellipse cx="120" cy="54" rx="8" ry="5"
          fill="rgba(255,255,255,0.16)" transform="rotate(-10 120 54)"/>

        {/* Ranura de monedas */}
        <rect x="68" y="37" width="42" height="7" rx="3.5" fill="#180800"/>
        <rect x="67" y="36" width="44" height="9" rx="4.5"
          fill="none" stroke="rgba(100,50,0,0.22)" strokeWidth="1"/>

        {/* Cabeza */}
        <circle cx="164" cy="85" r="31" fill="url(#hCer)"/>

        {/* Oreja */}
        <ellipse cx="173" cy="57" rx="10" ry="15" fill="url(#hDrk)" transform="rotate(18 173 57)"/>
        <ellipse cx="173" cy="57" rx="6"  ry="10" fill="#D0A04A"   transform="rotate(18 173 57)"/>

        {/* Ojo */}
        <circle cx="173" cy="81" r="5.5" fill="#180800"/>
        <circle cx="175" cy="79" r="2.2" fill="rgba(255,255,255,0.88)"/>

        {/* Hocico */}
        <ellipse cx="189" cy="97" rx="15.5" ry="12" fill="url(#hSnout)"/>
        <circle cx="184" cy="97" r="3.5" fill="rgba(80,40,0,0.5)"/>
        <circle cx="193" cy="97" r="3.5" fill="rgba(80,40,0,0.5)"/>

        {/* Patas delanteras (más claras, delante) */}
        <rect x="115" y="160" width="21" height="33" rx="10.5" fill="url(#hCer)"/>
        <rect x="68"  y="160" width="21" height="33" rx="10.5" fill="url(#hCer)"/>

        {/* Sombra suelo */}
        <ellipse cx="97" cy="200" rx="72" ry="6" fill="rgba(100,50,0,0.1)"/>
      </svg>
    </motion.div>
  );
}

// ─── Moneda cayendo en la ranura ───────────────────────────────────────────────
function CoinDrop({ id, onDone }: { id: number; onDone: (id: number) => void }) {
  return (
    <motion.div
      key={id}
      initial={{ y: -70, scale: 1.3, opacity: 1, rotate: -18 }}
      animate={{ y: 0,   scale: 0.05, opacity: 0, rotate: 18 }}
      transition={{ duration: 0.52, ease: [0.55, 0.05, 0.9, 0.5] }}
      onAnimationComplete={() => onDone(id)}
      style={{
        position: "absolute",
        top: "18%",
        left: "46%",
        transform: "translateX(-50%)",
        fontSize: 32,
        pointerEvents: "none",
        zIndex: 30,
        lineHeight: 1,
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

// ─── Página ────────────────────────────────────────────────────────────────────
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

    const coinId = Date.now();
    setCoins((p) => [...p, coinId]);

    setTimeout(() => {
      setJiggle(true);
      setTimeout(() => setJiggle(false), 520);
    }, 460);

    const entry = await addContribucion(userName);
    if (entry) {
      setStats((prev) => ({
        total: prev.total + 1,
        totalRut: userName === "rut" ? prev.totalRut + 1 : prev.totalRut,
        totalAlejandro: userName === "alejandro" ? prev.totalAlejandro + 1 : prev.totalAlejandro,
        entries: [entry, ...prev.entries],
      }));
      setToast(userName === "rut" ? "🪙 Rut negó un piropo · +1€" : "🪙 Alejandro negó un piropo · +1€");
      setTimeout(() => setToast(null), 2800);
    }
    setAdding(null);
  };

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg-primary)", overflow: "hidden" }}>

      {/* Float keyframes */}
      <style>{`
        @keyframes hFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
      `}</style>

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
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.3px" }}>Hucha 🐷</h1>
            <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0 }}>Cada piropo negado, 1€</p>
          </div>
        </div>
      </motion.div>

      {/* Contenido */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", paddingBottom: "100px" }}>

        {/* Tarjeta principal */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{
            background: "linear-gradient(160deg, #FFF9F5 0%, #FFF2E8 100%)",
            borderRadius: 28, padding: "28px 20px 24px",
            marginBottom: 14, boxShadow: "0 6px 32px rgba(120,50,10,0.13)",
            border: "1px solid rgba(180,90,30,0.1)", position: "relative", overflow: "hidden",
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
                  background: "#3D1204", borderRadius: 22, padding: "8px 18px",
                  fontSize: 13, fontWeight: 700, color: "white",
                  whiteSpace: "nowrap", zIndex: 40, boxShadow: "0 4px 18px rgba(60,18,4,0.3)",
                }}
              >{toast}</motion.div>
            )}
          </AnimatePresence>

          {/* Hucha + monedas */}
          <div style={{ position: "relative", animation: "hFloat 3.2s ease-in-out infinite" }}>
            <Hucha jiggle={jiggle} />
            <AnimatePresence>
              {coins.map((id) => (
                <CoinDrop key={id} id={id} onDone={removeCoin} />
              ))}
            </AnimatePresence>
          </div>

          {/* Contador */}
          <div style={{ textAlign: "center", marginTop: 14 }}>
            <motion.p
              key={stats.total}
              initial={{ scale: 1.35, color: "#34C759" }}
              animate={{ scale: 1, color: "#3D1204" }}
              transition={{ type: "spring", stiffness: 450, damping: 20 }}
              style={{ fontSize: 62, fontWeight: 900, margin: 0, letterSpacing: "-3px", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}
            >
              {loading ? "—" : `€${stats.total}`}
            </motion.p>
            <p style={{ fontSize: 13, color: "rgba(60,18,4,0.42)", margin: "5px 0 20px", fontWeight: 500 }}>
              ahorrados juntos
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 28, alignItems: "center" }}>
              <div style={{ textAlign: "center" }}>
                <motion.p key={`r-${stats.totalRut}`} initial={{ scale: 1.3 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  style={{ fontSize: 26, fontWeight: 800, color: "#FF2D55", margin: 0 }}
                >€{stats.totalRut}</motion.p>
                <p style={{ fontSize: 11, color: "rgba(60,18,4,0.4)", margin: "2px 0 0", fontWeight: 600 }}>Rut</p>
              </div>
              <div style={{ width: 1, height: 40, background: "rgba(60,18,4,0.1)" }} />
              <div style={{ textAlign: "center" }}>
                <motion.p key={`a-${stats.totalAlejandro}`} initial={{ scale: 1.3 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  style={{ fontSize: 26, fontWeight: 800, color: "#3D1204", margin: 0 }}
                >€{stats.totalAlejandro}</motion.p>
                <p style={{ fontSize: 11, color: "rgba(60,18,4,0.4)", margin: "2px 0 0", fontWeight: 600 }}>Alejandro</p>
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
              { name: "rut",       label: "+1€ Rut",       bg: "linear-gradient(135deg,#FF2D55,#FF6B8A)", shadow: "rgba(255,45,85,0.32)" },
              { name: "alejandro", label: "+1€ Alejandro", bg: "linear-gradient(135deg,#3D1204,#7B3210)", shadow: "rgba(61,18,4,0.35)" },
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
                <span style={{ fontSize: 24 }}>{adding === name ? "⏳" : "🪙"}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: adding === name ? "rgba(0,0,0,0.3)" : "white" }}>
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
                  <motion.div key={e.id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    style={{ background: "white", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.04)" }}
                  >
                    <span style={{ fontSize: 18 }}>{e.user_name === "rut" ? "💗" : "🖤"}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                        {e.user_name === "rut" ? "Rut" : "Alejandro"} negó un piropo
                      </p>
                      <p style={{ fontSize: 11, color: "var(--text-quaternary)", margin: "2px 0 0" }}>{timeAgo(e.created_at)}</p>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#34C759" }}>+€1</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!loading && stats.entries.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            style={{ textAlign: "center", paddingTop: 20 }}>
            <p style={{ fontSize: 14, color: "var(--text-quaternary)", fontWeight: 500 }}>La hucha está vacía 🐷</p>
            <p style={{ fontSize: 12, color: "var(--text-quaternary)", opacity: 0.7 }}>Negad un piropo y ponéis el primer euro</p>
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

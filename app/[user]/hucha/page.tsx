"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore, UserName } from "@/store/userStore";
import { loadHucha, addContribucion, type HuchaStats } from "@/lib/hucha";

// ─── Perro salchicha hucha ─────────────────────────────────────────────────────
// Construido con paths bezier reales, no con elipses sueltas.
// ViewBox 400×270. Slot en x≈205 (52%), y≈90 (33%).
function DachshundSVG({ jiggle }: { jiggle: boolean }) {
  return (
    <motion.div
      animate={jiggle ? { rotate: [-3, 3, -2, 2, 0], y: [0, -6, 0] } : {}}
      transition={{ duration: 0.48, ease: "easeOut" }}
      style={{ display: "flex", justifyContent: "center", width: "100%" }}
    >
      <svg
        viewBox="0 0 400 270"
        overflow="visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", maxWidth: 300 }}
      >
        <defs>
          {/* Gradiente principal del cuerpo: chocolate cálido */}
          <radialGradient id="hbody" cx="38%" cy="28%" r="72%">
            <stop offset="0%"   stopColor="#C46830" />
            <stop offset="55%"  stopColor="#7B3210" />
            <stop offset="100%" stopColor="#3D1204" />
          </radialGradient>
          {/* Gradiente cabeza (más claro en frente) */}
          <radialGradient id="hhead" cx="35%" cy="30%" r="68%">
            <stop offset="0%"   stopColor="#CE7238" />
            <stop offset="100%" stopColor="#3D1204" />
          </radialGradient>
          {/* Patas: más oscuras, sombreadas */}
          <linearGradient id="hleg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#6B2C0A" />
            <stop offset="100%" stopColor="#421506" />
          </linearGradient>
          {/* Sombra para patas traseras (más lejos) */}
          <linearGradient id="hlegfar" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#521F07" />
            <stop offset="100%" stopColor="#311004" />
          </linearGradient>
        </defs>

        {/* ── OREJA larga y caída (detrás de la cabeza) ─────────────── */}
        <path
          d="M 88 105
             C 106 98, 116 118, 112 152
             C 108 178, 88 192, 74 178
             C 60 164, 64 132, 88 105 Z"
          fill="#3D1204"
          opacity="0.88"
        />

        {/* ── CUERPO principal — path bezier cerrado ─────────────────── */}
        {/*   Hombro → lomo → grupa → vientre → pecho → cierre          */}
        <path
          d="M 122 112
             C 162 90, 248 82, 318 86
             C 356 88, 380 106, 384 134
             C 388 158, 372 182, 346 194
             C 322 204, 274 208, 216 207
             C 158 206, 116 196, 96 178
             C 78 162, 80 140, 94 122
             C 102 114, 114 112, 122 112 Z"
          fill="url(#hbody)"
        />

        {/* ── CUELLO — une cabeza y cuerpo sin costura ───────────────── */}
        <path
          d="M 94 122
             C 94 106, 108 95, 128 96
             C 148 97, 158 112, 152 128
             C 146 144, 126 148, 108 140
             C 95 133, 93 128, 94 122 Z"
          fill="url(#hhead)"
        />

        {/* ── CABEZA — óvalo grande, bien proporcioando ──────────────── */}
        <ellipse cx="80" cy="115" rx="60" ry="53" fill="url(#hhead)" />

        {/* ── MORRO superior ─────────────────────────────────────────── */}
        <path
          d="M 28 114
             C 26 100, 38 88, 58 91
             C 74 93, 82 107, 76 124
             C 72 136, 56 141, 40 133
             C 24 125, 24 120, 28 114 Z"
          fill="url(#hbody)"
        />

        {/* ── MANDÍBULA inferior (papada) ────────────────────────────── */}
        <path
          d="M 30 124 C 28 134, 36 144, 52 146 C 62 148, 72 142, 74 132
             C 64 137, 46 136, 35 128 Z"
          fill="#3D1204"
          opacity="0.55"
        />

        {/* ── BRILLO CERÁMICO cuerpo ──────────────────────────────────── */}
        <ellipse
          cx="230" cy="102" rx="88" ry="24"
          fill="white" opacity="0.11"
          transform="rotate(-8 230 102)"
        />

        {/* ── BRILLO CERÁMICO cabeza ──────────────────────────────────── */}
        <ellipse
          cx="65" cy="96" rx="28" ry="16"
          fill="white" opacity="0.2"
          transform="rotate(-22 65 96)"
        />

        {/* ── RANURA DE MONEDAS ───────────────────────────────────────── */}
        {/* Caja exterior oscura */}
        <rect x="182" y="82" width="68" height="16" rx="8" fill="#0E0300" opacity="0.9" />
        {/* Interior más oscuro */}
        <rect x="184" y="84" width="64" height="8" rx="4" fill="#060100" />
        {/* Pequeño brillo en el borde superior del slot */}
        <rect x="186" y="85" width="30" height="2.5" rx="1.25" fill="rgba(255,255,255,0.09)" />

        {/* ── OJO ────────────────────────────────────────────────────── */}
        <circle cx="58" cy="107" r="13" fill="#0A0200" />
        {/* Reflejo principal */}
        <circle cx="63" cy="102" r="5.5" fill="white" opacity="0.85" />
        {/* Reflejo pequeño secundario */}
        <circle cx="62" cy="103" r="2.5" fill="white" />

        {/* ── NARIZ ──────────────────────────────────────────────────── */}
        <ellipse cx="17" cy="118" rx="10" ry="9" fill="#0A0200" />
        <ellipse cx="18" cy="113" rx="4" ry="3" fill="rgba(255,255,255,0.28)" />

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* PATAS — paths con forma real de pata, unidas al cuerpo       */}
        {/* ══════════════════════════════════════════════════════════════ */}

        {/* Pata trasera lejana (a la derecha, más oscura) */}
        <path
          d="M 310 200
             C 308 212, 306 228, 308 244
             C 310 253, 320 256, 328 252
             C 336 248, 337 240, 334 230
             C 331 218, 328 206, 322 200 Z"
          fill="url(#hlegfar)"
          opacity="0.82"
        />

        {/* Pata trasera cercana */}
        <path
          d="M 282 202
             C 280 214, 278 230, 280 246
             C 282 255, 292 258, 300 254
             C 308 250, 309 242, 307 232
             C 304 220, 300 208, 292 202 Z"
          fill="url(#hleg)"
        />
        <path
          d="M 285 207 C 284 216, 283 228, 285 240"
          stroke="rgba(255,255,255,0.11)" strokeWidth="5" strokeLinecap="round" fill="none"
        />

        {/* Pata delantera lejana */}
        <path
          d="M 152 198
             C 150 210, 148 226, 150 242
             C 152 251, 162 254, 170 250
             C 178 246, 179 238, 176 228
             C 173 216, 170 204, 162 198 Z"
          fill="url(#hlegfar)"
          opacity="0.82"
        />

        {/* Pata delantera cercana */}
        <path
          d="M 124 200
             C 122 212, 120 228, 122 244
             C 124 253, 134 256, 142 252
             C 150 248, 151 240, 149 230
             C 146 218, 142 206, 134 200 Z"
          fill="url(#hleg)"
        />
        <path
          d="M 127 205 C 126 214, 125 226, 127 238"
          stroke="rgba(255,255,255,0.11)" strokeWidth="5" strokeLinecap="round" fill="none"
        />

        {/* ── COLA — curva hacia arriba ───────────────────────────────── */}
        <path
          d="M 378 155
             C 396 142, 406 118, 394 98
             C 384 80, 362 80, 360 96
             C 370 88, 386 92, 390 106
             C 394 120, 380 138, 372 150 Z"
          fill="url(#hbody)"
        />
        <path
          d="M 380 151 C 394 138, 402 118, 392 100"
          stroke="rgba(255,255,255,0.09)" strokeWidth="4" strokeLinecap="round" fill="none"
        />
      </svg>
    </motion.div>
  );
}

// ─── Moneda cayendo en la ranura ──────────────────────────────────────────────
// Slot en viewBox 400×270: x=216 (54%), y=90 (33%)
function CoinDrop({ id, onDone }: { id: number; onDone: (id: number) => void }) {
  return (
    <motion.div
      key={id}
      initial={{ y: -60, scale: 1.2, opacity: 1, rotate: -20 }}
      animate={{ y: 6, scale: 0.05, opacity: 0, rotate: 20 }}
      transition={{ duration: 0.5, ease: [0.6, 0, 0.9, 0.5] }}
      onAnimationComplete={() => onDone(id)}
      style={{
        position: "absolute",
        top: "33%",
        left: "54%",
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

    // El perrillo se mueve cuando la moneda llega a la ranura (~480ms)
    setTimeout(() => {
      setJiggle(true);
      setTimeout(() => setJiggle(false), 520);
    }, 450);

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

        {/* Tarjeta principal */}
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

          {/* SVG + monedas animadas */}
          <div style={{ position: "relative" }}>
            <DachshundSVG jiggle={jiggle} />
            <AnimatePresence>
              {coins.map((id) => (
                <CoinDrop key={id} id={id} onDone={removeCoin} />
              ))}
            </AnimatePresence>
          </div>

          {/* Contador */}
          <div style={{ textAlign: "center", marginTop: 12 }}>
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

        {!loading && stats.entries.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            style={{ textAlign: "center", paddingTop: 20 }}
          >
            <p style={{ fontSize: 14, color: "var(--text-quaternary)", fontWeight: 500 }}>La hucha está vacía 🐶</p>
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

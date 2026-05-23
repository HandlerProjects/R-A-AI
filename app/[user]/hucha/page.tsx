"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore, UserName } from "@/store/userStore";
import { loadHucha, addContribucion, type HuchaStats } from "@/lib/hucha";

// ─── Dachshund sticker illustration ───────────────────────────────────────────
// Estilo "sticker": contorno oscuro + relleno degradado.
// El outline unifica todos los elementos y esconde las uniones.
// ViewBox 360×235. Slot ≈ x=200(55%), y=88(37%).
function DachshundSVG({ jiggle }: { jiggle: boolean }) {
  const STROKE = "#4A1A00";
  const SW = 3;
  const SW2 = 2.5;

  return (
    <motion.div
      animate={jiggle ? { rotate: [-3, 3, -2, 2, 0], y: [0, -6, 0] } : {}}
      transition={{ duration: 0.46, ease: "easeOut" }}
      style={{ display: "flex", justifyContent: "center", width: "100%" }}
    >
      <svg
        viewBox="0 0 360 235"
        overflow="visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", maxWidth: 290 }}
      >
        <defs>
          <radialGradient id="dg" cx="38%" cy="28%" r="72%">
            <stop offset="0%"   stopColor="#D4844A" />
            <stop offset="60%"  stopColor="#9B4A1E" />
            <stop offset="100%" stopColor="#5C2008" />
          </radialGradient>
          <radialGradient id="dhd" cx="32%" cy="26%" r="68%">
            <stop offset="0%"   stopColor="#DE8E54" />
            <stop offset="100%" stopColor="#5C2008" />
          </radialGradient>
          <radialGradient id="dear" cx="30%" cy="20%" r="80%">
            <stop offset="0%"   stopColor="#8B3C12" />
            <stop offset="100%" stopColor="#3D1004" />
          </radialGradient>
          <radialGradient id="dleg" cx="25%" cy="20%" r="80%">
            <stop offset="0%"   stopColor="#B05A22" />
            <stop offset="100%" stopColor="#5C2008" />
          </radialGradient>
          <radialGradient id="dlegf" cx="25%" cy="20%" r="80%">
            <stop offset="0%"   stopColor="#7B3210" />
            <stop offset="100%" stopColor="#3D1004" />
          </radialGradient>
        </defs>

        {/* ── OREJA (renderizada primero, queda detrás de la cabeza) ─── */}
        <path
          d="M 98 78
             C 118 68, 132 90, 124 132
             C 116 166, 94 176, 78 160
             C 62 144, 66 110, 82 88
             C 88 80, 94 76, 98 78 Z"
          fill="url(#dear)"
          stroke={STROKE}
          strokeWidth={SW}
          strokeLinejoin="round"
        />

        {/* ── CUERPO — path bezier, forma real de salchicha ────────────── */}
        <path
          d="M 110 104
             C 150 87, 240 82, 304 88
             C 335 92, 348 110, 346 132
             C 344 154, 330 172, 302 178
             C 265 184, 165 184, 118 176
             C 94 170, 83 155, 85 132
             C 87 113, 97 106, 110 104 Z"
          fill="url(#dg)"
          stroke={STROKE}
          strokeWidth={SW}
          strokeLinejoin="round"
        />

        {/* ── CUELLO — rellena la unión sin costura visible ──────────── */}
        <path
          d="M 85 132 C 85 112, 98 98, 118 98
             C 138 98, 150 114, 144 132
             C 138 148, 120 152, 102 144
             C 88 136, 84 136, 85 132 Z"
          fill="url(#dhd)"
          stroke={STROKE}
          strokeWidth={SW}
          strokeLinejoin="round"
        />

        {/* ── CABEZA ─────────────────────────────────────────────────── */}
        <ellipse
          cx="76" cy="114" rx="50" ry="46"
          fill="url(#dhd)"
          stroke={STROKE}
          strokeWidth={SW}
        />

        {/* ── MORRO ─────────────────────────────────────────────────── */}
        <path
          d="M 26 118
             C 24 102, 38 90, 60 93
             C 76 96, 84 112, 78 130
             C 74 142, 58 147, 42 138
             C 24 128, 24 125, 26 118 Z"
          fill="url(#dhd)"
          stroke={STROKE}
          strokeWidth={SW}
          strokeLinejoin="round"
        />

        {/* ── PAPADA / mentón ────────────────────────────────────────── */}
        <path
          d="M 28 128 C 26 140, 36 150, 52 150 C 64 150, 74 142, 76 132"
          stroke={STROKE}
          strokeWidth={SW2}
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />

        {/* ── RANURA (coin slot) ─────────────────────────────────────── */}
        <rect x="172" y="84" width="62" height="14" rx="7"
          fill="#0E0400" stroke={STROKE} strokeWidth="1.5" />
        <rect x="174" y="86" width="58" height="7" rx="3.5"
          fill="#060100" />
        {/* borde reflejo superior */}
        <rect x="176" y="87" width="26" height="2" rx="1"
          fill="rgba(255,255,255,0.08)" />

        {/* ── BRILLO CERÁMICA ───────────────────────────────────────── */}
        <ellipse
          cx="224" cy="100" rx="76" ry="20"
          fill="white" opacity="0.09"
          transform="rotate(-8 224 100)"
        />
        <ellipse
          cx="62" cy="96" rx="26" ry="15"
          fill="white" opacity="0.16"
          transform="rotate(-20 62 96)"
        />

        {/* ── OJO ───────────────────────────────────────────────────── */}
        <circle cx="58" cy="107" r="13"
          fill="#0A0100" stroke={STROKE} strokeWidth="1.5" />
        <circle cx="63" cy="101" r="5.5"
          fill="white" opacity="0.88" />
        <circle cx="62" cy="103" r="2.5"
          fill="white" />

        {/* ── NARIZ ─────────────────────────────────────────────────── */}
        <ellipse cx="15" cy="122" rx="11" ry="9"
          fill="#0A0100" stroke={STROKE} strokeWidth="1.5" />
        <ellipse cx="16" cy="118" rx="4.5" ry="3.5"
          fill="rgba(255,255,255,0.25)" />

        {/* ══ PATAS ════════════════════════════════════════════════════ */}
        {/* Orden: far (oscura) primero, near (clara) encima             */}

        {/* Pata trasera lejana */}
        <path
          d="M 262 177 C 259 190, 257 207, 259 223
             C 261 231, 271 234, 279 231
             C 287 228, 289 219, 286 209
             C 283 197, 279 184, 272 177 Z"
          fill="url(#dlegf)"
          stroke={STROKE}
          strokeWidth={SW2}
          strokeLinejoin="round"
        />

        {/* Pata trasera cercana */}
        <path
          d="M 240 179 C 237 192, 235 209, 237 225
             C 239 233, 249 236, 257 233
             C 265 230, 267 221, 264 211
             C 261 199, 257 186, 250 179 Z"
          fill="url(#dleg)"
          stroke={STROKE}
          strokeWidth={SW}
          strokeLinejoin="round"
        />
        <path d="M 243 184 C 242 194, 241 207, 243 219"
          stroke="rgba(255,255,255,0.13)" strokeWidth="5" strokeLinecap="round" fill="none" />

        {/* Pata delantera lejana */}
        <path
          d="M 126 174 C 123 187, 121 204, 123 220
             C 125 228, 135 231, 143 228
             C 151 225, 153 216, 150 206
             C 147 194, 143 181, 136 174 Z"
          fill="url(#dlegf)"
          stroke={STROKE}
          strokeWidth={SW2}
          strokeLinejoin="round"
        />

        {/* Pata delantera cercana */}
        <path
          d="M 104 176 C 101 189, 99 206, 101 222
             C 103 230, 113 233, 121 230
             C 129 227, 131 218, 128 208
             C 125 196, 121 183, 114 176 Z"
          fill="url(#dleg)"
          stroke={STROKE}
          strokeWidth={SW}
          strokeLinejoin="round"
        />
        <path d="M 107 181 C 106 191, 105 204, 107 216"
          stroke="rgba(255,255,255,0.13)" strokeWidth="5" strokeLinecap="round" fill="none" />

        {/* ── COLA (curva hacia arriba, detrás del cuerpo) ───────────── */}
        <path
          d="M 340 150 C 360 138, 370 114, 358 96
             C 347 80, 328 82, 330 96
             C 338 89, 352 93, 355 108
             C 358 122, 344 140, 336 152 Z"
          fill="url(#dg)"
          stroke={STROKE}
          strokeWidth={SW}
          strokeLinejoin="round"
        />
      </svg>
    </motion.div>
  );
}

// ─── Moneda que cae en la ranura ──────────────────────────────────────────────
// Slot en viewBox 360×235: centro x=203(56%), y=91(39%)
function CoinDrop({ id, onDone }: { id: number; onDone: (id: number) => void }) {
  return (
    <motion.div
      key={id}
      initial={{ y: -65, scale: 1.2, opacity: 1, rotate: -18 }}
      animate={{ y: 0,   scale: 0.05, opacity: 0, rotate: 18 }}
      transition={{ duration: 0.5, ease: [0.55, 0.05, 0.9, 0.5] }}
      onAnimationComplete={() => onDone(id)}
      style={{
        position: "absolute",
        top: "39%",
        left: "56%",
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
            background: "linear-gradient(160deg, #FFF8F4 0%, #FFF3EE 100%)",
            borderRadius: 28, padding: "28px 20px 24px",
            marginBottom: 14, boxShadow: "0 6px 28px rgba(150,60,10,0.12)",
            border: "1px solid rgba(200,100,40,0.12)", position: "relative", overflow: "hidden",
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

          {/* SVG + monedas */}
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
              animate={{ scale: 1, color: "#3D1204" }}
              transition={{ type: "spring", stiffness: 450, damping: 20 }}
              style={{ fontSize: 62, fontWeight: 900, margin: 0, letterSpacing: "-3px", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}
            >
              {loading ? "—" : `€${stats.total}`}
            </motion.p>
            <p style={{ fontSize: 13, color: "rgba(60,18,4,0.45)", margin: "5px 0 20px", fontWeight: 500 }}>
              ahorrados juntos
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: 28, alignItems: "center" }}>
              <div style={{ textAlign: "center" }}>
                <motion.p
                  key={`r-${stats.totalRut}`}
                  initial={{ scale: 1.3 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  style={{ fontSize: 26, fontWeight: 800, color: "#FF2D55", margin: 0 }}
                >€{stats.totalRut}</motion.p>
                <p style={{ fontSize: 11, color: "rgba(60,18,4,0.4)", margin: "2px 0 0", fontWeight: 600 }}>Rut</p>
              </div>
              <div style={{ width: 1, height: 40, background: "rgba(60,18,4,0.1)" }} />
              <div style={{ textAlign: "center" }}>
                <motion.p
                  key={`a-${stats.totalAlejandro}`}
                  initial={{ scale: 1.3 }} animate={{ scale: 1 }}
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            style={{ textAlign: "center", paddingTop: 20 }}>
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

"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore, UserName } from "@/store/userStore";
import { getBothProfiles, upsertProfile, type UserProfile } from "@/lib/profiles";
import { uploadPhoto } from "@/lib/upload";

const COUPLE_DATE = "2025-01-30";
const MEET_DATE   = "2024-11-14";

function daysSince(d: string | null) {
  if (!d) return 0;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
}

function breakdown(d: string | null) {
  if (!d) return { y: 0, m: 0, days: 0, h: 0 };
  const s = new Date(d), n = new Date();
  let y = n.getFullYear() - s.getFullYear();
  let m = n.getMonth() - s.getMonth();
  let days = n.getDate() - s.getDate();
  if (days < 0) { m--; days += new Date(n.getFullYear(), n.getMonth(), 0).getDate(); }
  if (m < 0)    { y--;  m += 12; }
  return { y, m, days, h: Math.floor((n.getTime() - s.getTime()) / 3_600_000) };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// MRZ line helper
function mrz(name: string, id: string) {
  const n = name.toUpperCase().padEnd(12, "<").slice(0, 12);
  const i = id.replace("-", "").padEnd(10, "<");
  return `${n}<<${i}<<<<<<<<`;
}

const BADGES: Record<string, { icon: string; label: string }[]> = {
  alejandro: [
    { icon: "🚀", label: "Startup founder" },
    { icon: "💪", label: "Primera pelea superada" },
    { icon: "🌙", label: "Rey larga distancia" },
    { icon: "📱", label: "Always on the phone" },
  ],
  rut: [
    { icon: "🎓", label: "TFG warrior 2026" },
    { icon: "💪", label: "Primera pelea superada" },
    { icon: "🌙", label: "Reina larga distancia" },
    { icon: "🧠", label: "Psicóloga en prácticas" },
  ],
};

const PODER: Record<string, string> = {
  alejandro: "Capaz de hacer reír a Rut incluso cuando está enfadada con él",
  rut:       "Calmar a Alejandro con una sola mirada y medio abrazo",
};

/* ─── Page ─────────────────────────────────────────────────────────────────── */
export default function CarnetPage() {
  const params   = useParams();
  const router   = useRouter();
  const { activeUser, setUser } = useUserStore();
  const user = params.user as UserName;

  useEffect(() => { if (user !== activeUser) setUser(user, user); }, [user]);

  const isAle = user === "alejandro";
  const [profiles, setProfiles] = useState<{ alejandro: UserProfile | null; rut: UserProfile | null }>({ alejandro: null, rut: null });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [apodo, setApodo]     = useState("");
  const [fecha, setFecha]     = useState(COUPLE_DATE);
  const [saving, setSaving]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getBothProfiles().then((p) => {
      setProfiles(p);
      setLoading(false);
      const mine = user === "alejandro" ? p.alejandro : p.rut;
      setApodo(mine?.apodo ?? "");
      setFecha(mine?.fecha_inicio ?? COUPLE_DATE);
    });
  }, [user]);

  const mine  = isAle ? profiles.alejandro : profiles.rut;
  const other = isAle ? profiles.rut : profiles.alejandro;
  const fi    = mine?.fecha_inicio ?? other?.fecha_inicio ?? COUPLE_DATE;
  const days  = daysSince(fi);
  const bd    = breakdown(fi);

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const url = await uploadPhoto(file, `perfiles/${user}`);
    if (url) { await upsertProfile(user, { photo_url: url }); setProfiles(await getBothProfiles()); }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSave = async () => {
    setSaving(true);
    await upsertProfile(user,  { apodo: apodo.trim() || null, fecha_inicio: fecha || null });
    await upsertProfile(isAle ? "rut" : "alejandro", { fecha_inicio: fecha || null });
    setProfiles(await getBothProfiles());
    setEditing(false); setSaving(false);
  };

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "#111", overflow: "hidden" }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        style={{ padding: "14px 20px", paddingTop: `calc(14px + env(safe-area-inset-top))`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <button onClick={() => router.back()}
          style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "white", margin: 0 }}>Carnets R&A 💕</h1>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>{days.toLocaleString("es-ES")} días juntos</p>
        </div>
        <button onClick={() => setEditing(true)}
          style={{ padding: "7px 14px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Editar
        </button>
      </motion.div>

      {/* Cards */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px", paddingBottom: "calc(32px + env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", gap: 28 }}>
        {loading ? (
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, textAlign: "center", marginTop: 80 }}>Cargando…</p>
        ) : (
          <>
            <DNICard
              name={isAle ? "Alejandro" : "Rut"}
              surname={isAle ? "Bahillo" : ""}
              status={isAle ? "NOVIO OFICIAL" : "NOVIA OFICIAL"}
              photoUrl={mine?.photo_url ?? null}
              apodo={mine?.apodo ?? null}
              cardId={isAle ? "R&A-001" : "R&A-002"}
              accentColor={isAle ? "#2563EB" : "#E11D48"}
              isMine={true}
              uploading={uploading}
              onPhoto={() => fileRef.current?.click()}
              fechaEmision={fmtDate(COUPLE_DATE)}
              badges={BADGES[isAle ? "alejandro" : "rut"]}
              poder={PODER[isAle ? "alejandro" : "rut"]}
              bd={bd}
              delay={0.05}
            />
            <DNICard
              name={isAle ? "Rut" : "Alejandro"}
              surname={isAle ? "" : "Bahillo"}
              status={isAle ? "NOVIA OFICIAL" : "NOVIO OFICIAL"}
              photoUrl={other?.photo_url ?? null}
              apodo={other?.apodo ?? null}
              cardId={isAle ? "R&A-002" : "R&A-001"}
              accentColor={isAle ? "#E11D48" : "#2563EB"}
              isMine={false}
              uploading={false}
              onPhoto={() => {}}
              fechaEmision={fmtDate(COUPLE_DATE)}
              badges={BADGES[isAle ? "rut" : "alejandro"]}
              poder={PODER[isAle ? "rut" : "alejandro"]}
              bd={bd}
              delay={0.14}
            />
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
          </>
        )}
      </div>

      {/* Edit sheet */}
      <AnimatePresence>
        {editing && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditing(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 40 }} />
            <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#1c1c1e", borderRadius: "24px 24px 0 0", padding: "24px 20px", paddingBottom: "calc(24px + env(safe-area-inset-bottom))", zIndex: 50 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", margin: "0 auto 20px" }} />
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "white", margin: "0 0 18px" }}>Editar mi carnet</h3>
              <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Mi apodo
              </label>
              <input value={apodo} onChange={(e) => setApodo(e.target.value)}
                placeholder={`¿Cómo te llama ${isAle ? "Rut" : "Alejandro"}?`}
                style={{ display: "block", width: "100%", marginTop: 6, marginBottom: 14, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 14px", fontSize: 15, color: "white", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
              <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Fecha de inicio
              </label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
                style={{ display: "block", width: "100%", marginTop: 6, marginBottom: 22, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 14px", fontSize: 15, color: "white", outline: "none", fontFamily: "inherit", boxSizing: "border-box", colorScheme: "dark" }} />
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setEditing(false)}
                  style={{ flex: 1, padding: 13, background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 14, color: "rgba(255,255,255,0.5)", fontSize: 14, cursor: "pointer" }}>
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={saving}
                  style={{ flex: 2, padding: 13, background: "linear-gradient(135deg,#E11D48,#7C3AED)", border: "none", borderRadius: 14, color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  {saving ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── DNI Card ──────────────────────────────────────────────────────────────── */
interface DNIProps {
  name: string; surname: string; status: string; photoUrl: string | null; apodo: string | null;
  cardId: string; accentColor: string; isMine: boolean; uploading: boolean; onPhoto: () => void;
  fechaEmision: string; badges: { icon: string; label: string }[];
  poder: string; bd: { y: number; m: number; days: number; h: number }; delay: number;
}

function DNICard(p: DNIProps) {
  const [flipped, setFlipped] = useState(false);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setHint(true),  1200 + p.delay * 600);
    const t2 = setTimeout(() => setHint(false), 3800 + p.delay * 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 24, delay: p.delay }}
      style={{ position: "relative" }}>

      <AnimatePresence>
        {hint && !flipped && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "absolute", bottom: -20, width: "100%", textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.25)", pointerEvents: "none", zIndex: 2 }}>
            Toca para girar 🔄
          </motion.p>
        )}
      </AnimatePresence>

      <div style={{ perspective: 1400 }} onClick={() => setFlipped((f) => !f)}>
        <motion.div animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 28 }}
          style={{ position: "relative", transformStyle: "preserve-3d", cursor: "pointer" }}>

          {/* ═══ FRONT ═══ */}
          <div style={{
            backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
            borderRadius: 16, overflow: "hidden",
            boxShadow: "0 12px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)",
            background: "#f0ede8",
          }}>
            {/* Header bar */}
            <div style={{ background: p.accentColor, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 14 }}>💕</span>
                </div>
                <div>
                  <p style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", margin: 0, letterSpacing: "0.1em", fontWeight: 700 }}>DOCUMENTO DE IDENTIDAD</p>
                  <p style={{ fontSize: 11, color: "white", margin: 0, fontWeight: 800, letterSpacing: "0.06em" }}>R&A PAREJA OFICIAL</p>
                </div>
              </div>
              {p.isMine && (
                <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.9)", background: "rgba(255,255,255,0.2)", padding: "3px 8px", borderRadius: 10, letterSpacing: "0.06em" }}>
                  TÚ
                </span>
              )}
            </div>

            {/* Body */}
            <div style={{ display: "flex", gap: 0, background: "#f5f2ed" }}>
              {/* Photo column */}
              <div style={{ width: 110, flexShrink: 0, padding: "14px 0 14px 14px" }}>
                <div
                  onClick={(e) => { if (p.isMine) { e.stopPropagation(); p.onPhoto(); } }}
                  style={{
                    width: 90, height: 115, borderRadius: 8, overflow: "hidden",
                    background: p.photoUrl ? "transparent" : `${p.accentColor}18`,
                    border: `2px solid ${p.accentColor}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: p.isMine ? "pointer" : "default", position: "relative",
                  }}>
                  {p.photoUrl
                    ? <img src={p.photoUrl} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: 40, fontWeight: 800, color: p.accentColor, opacity: 0.6 }}>{p.name[0]}</span>}
                  {p.isMine && p.uploading && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 22 }}>⏳</span>
                    </div>
                  )}
                </div>
                {p.isMine && !p.uploading && (
                  <div onClick={(e) => { e.stopPropagation(); p.onPhoto(); }}
                    style={{ marginTop: 6, textAlign: "center", fontSize: 9, color: p.accentColor, fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em" }}>
                    CAMBIAR FOTO
                  </div>
                )}
                {/* Holographic strip */}
                <div style={{ marginTop: 10, height: 8, borderRadius: 4, background: "linear-gradient(90deg,#f87171,#fb923c,#facc15,#4ade80,#60a5fa,#a78bfa,#f472b6)", opacity: 0.7 }} />
              </div>

              {/* Data column */}
              <div style={{ flex: 1, padding: "14px 14px 10px 10px" }}>
                {/* Name */}
                <p style={{ fontSize: 9, color: "#9ca3af", fontWeight: 700, margin: "0 0 1px", letterSpacing: "0.08em" }}>NOMBRE COMPLETO</p>
                <p style={{ fontSize: 18, fontWeight: 900, color: "#111827", margin: "0 0 8px", letterSpacing: "-0.3px", lineHeight: 1.1 }}>
                  {p.name}{p.surname ? <span style={{ fontSize: 14, fontWeight: 700 }}><br />{p.surname}</span> : null}
                </p>

                {/* Status */}
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: `${p.accentColor}15`, border: `1.5px solid ${p.accentColor}40`, borderRadius: 6, padding: "3px 10px", marginBottom: 10 }}>
                  <span style={{ fontSize: 9 }}>❤️</span>
                  <span style={{ fontSize: 9, fontWeight: 900, color: p.accentColor, letterSpacing: "0.08em" }}>{p.status}</span>
                </div>

                {/* Fields grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px" }}>
                  <Field label="EXPEDIDO" value={p.fechaEmision} />
                  <Field label="Nº CARNET" value={p.cardId} />
                  <Field label="APODO" value={p.apodo ?? "—"} />
                  <Field label="ESTADO" value="✓ Verificado" color="#16a34a" />
                </div>
              </div>
            </div>

            {/* MRZ zone */}
            <div style={{ background: "#e8e4df", borderTop: "1px solid #d1cdc8", padding: "8px 14px" }}>
              <p style={{ fontFamily: "monospace", fontSize: 9, color: "#6b7280", margin: 0, letterSpacing: "0.12em", lineHeight: 1.6 }}>
                {mrz(p.name, p.cardId)}<br />
                {"R&A<<PAREJA<<OFICIAL<<" + p.cardId.replace("-", "") + "<<<<<<"}
              </p>
            </div>
          </div>

          {/* ═══ BACK ═══ */}
          <div style={{
            backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            position: "absolute", inset: 0,
            borderRadius: 16, overflow: "hidden",
            boxShadow: "0 12px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)",
            background: "#f5f2ed",
            display: "flex", flexDirection: "column",
          }}>
            {/* Magnetic stripe */}
            <div style={{ height: 38, background: "#1a1a1a", flexShrink: 0 }} />

            {/* Signature strip */}
            <div style={{ margin: "10px 14px 0", height: 30, background: "white", borderRadius: 4, border: "1px solid #d1d5db", display: "flex", alignItems: "center", paddingLeft: 10 }}>
              <span style={{ fontFamily: "serif", fontSize: 14, color: "#374151", fontStyle: "italic" }}>{p.name}</span>
            </div>

            {/* Content */}
            <div style={{ flex: 1, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10, overflow: "hidden" }}>
              {/* Time stats */}
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { val: p.bd.y,  label: "AÑOS" },
                  { val: p.bd.m,  label: "MESES" },
                  { val: p.bd.days, label: "DÍAS" },
                  { val: p.bd.h.toLocaleString("es-ES"), label: "HORAS", accent: true },
                ].map(({ val, label, accent }) => (
                  <div key={label} style={{ flex: 1, background: accent ? `${p.accentColor}12` : "rgba(0,0,0,0.04)", border: `1px solid ${accent ? p.accentColor + "30" : "rgba(0,0,0,0.08)"}`, borderRadius: 8, padding: "7px 4px", textAlign: "center" }}>
                    <p style={{ fontSize: label === "HORAS" ? 9 : 18, fontWeight: 800, color: label === "HORAS" ? p.accentColor : "#111827", margin: 0, lineHeight: 1 }}>{val}</p>
                    <p style={{ fontSize: 7, fontWeight: 800, color: "#9ca3af", margin: "3px 0 0", letterSpacing: "0.06em" }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Badges */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {p.badges.map((b) => (
                  <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: "4px 9px" }}>
                    <span style={{ fontSize: 11 }}>{b.icon}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#374151" }}>{b.label}</span>
                  </div>
                ))}
              </div>

              {/* Poder */}
              <div style={{ background: `${p.accentColor}10`, border: `1px solid ${p.accentColor}25`, borderRadius: 10, padding: "8px 10px" }}>
                <p style={{ fontSize: 8, fontWeight: 800, color: p.accentColor, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.08em" }}>⚡ Poder especial</p>
                <p style={{ fontSize: 10, color: "#374151", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>"{p.poder}"</p>
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </motion.div>
  );
}

function Field({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p style={{ fontSize: 8, fontWeight: 700, color: "#9ca3af", margin: "0 0 1px", letterSpacing: "0.08em" }}>{label}</p>
      <p style={{ fontSize: 11, fontWeight: 700, color: color ?? "#111827", margin: 0 }}>{value}</p>
    </div>
  );
}

function mrz(name: string, id: string) {
  const n = name.toUpperCase().padEnd(12, "<").slice(0, 12);
  const i = id.replace("-", "").padEnd(10, "<");
  return `${n}<<${i}<<<<<<<<`;
}

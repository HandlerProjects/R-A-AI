"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore, UserName } from "@/store/userStore";
import { getBothProfiles, upsertProfile, type UserProfile } from "@/lib/profiles";
import { uploadPhoto } from "@/lib/upload";

const COUPLE_DATE = "2023-06-15";

function daysTogether(fechaInicio: string | null): number {
  if (!fechaInicio) return 0;
  const start = new Date(fechaInicio);
  const now = new Date();
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function timeBreakdown(fechaInicio: string | null) {
  if (!fechaInicio) return { years: 0, months: 0, days: 0, hours: 0 };
  const start = new Date(fechaInicio);
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();
  if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
  if (months < 0) { years--; months += 12; }
  const totalHours = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60));
  return { years, months, days, hours: totalHours };
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

const BADGES_ALEJANDRO = [
  { icon: "🚀", label: "Startup founder" },
  { icon: "💪", label: "Primera pelea: superada" },
  { icon: "🌙", label: "Rey de la larga distancia" },
  { icon: "📱", label: "El que siempre está al teléfono" },
];
const PODER_ALEJANDRO = "Capaz de hacer reír a Rut incluso cuando está enfadada con él";

const BADGES_RUT = [
  { icon: "🎓", label: "TFG warrior 2026" },
  { icon: "💪", label: "Primera pelea: superada" },
  { icon: "🌙", label: "Reina de la larga distancia" },
  { icon: "🧠", label: "Psicóloga en prácticas" },
];
const PODER_RUT = "Calmar a Alejandro con una sola mirada y medio abrazo";

export default function CarnetPage() {
  const params = useParams();
  const router = useRouter();
  const { activeUser, setUser } = useUserStore();
  const userParam = params.user as UserName;

  useEffect(() => {
    if (userParam && userParam !== activeUser) setUser(userParam, userParam);
  }, [userParam, activeUser, setUser]);

  const isAlejandro = userParam === "alejandro";

  const [profiles, setProfiles] = useState<{ alejandro: UserProfile | null; rut: UserProfile | null }>({ alejandro: null, rut: null });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editApodo, setEditApodo] = useState("");
  const [editFecha, setEditFecha] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getBothProfiles().then((p) => {
      setProfiles(p);
      setLoading(false);
      const mine = userParam === "alejandro" ? p.alejandro : p.rut;
      setEditApodo(mine?.apodo ?? "");
      setEditFecha(mine?.fecha_inicio ?? COUPLE_DATE);
    });
  }, [userParam]);

  const myProfile = isAlejandro ? profiles.alejandro : profiles.rut;
  const otherProfile = isAlejandro ? profiles.rut : profiles.alejandro;
  const fechaInicio = myProfile?.fecha_inicio ?? otherProfile?.fecha_inicio ?? COUPLE_DATE;
  const days = daysTogether(fechaInicio);
  const time = timeBreakdown(fechaInicio);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    const url = await uploadPhoto(file, `perfiles/${userParam}`);
    if (url) {
      await upsertProfile(userParam, { photo_url: url });
      setProfiles(await getBothProfiles());
    }
    setUploadingPhoto(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    setSaving(true);
    await upsertProfile(userParam, { apodo: editApodo.trim() || null, fecha_inicio: editFecha || null });
    await upsertProfile(isAlejandro ? "rut" : "alejandro", { fecha_inicio: editFecha || null });
    setProfiles(await getBothProfiles());
    setEditing(false);
    setSaving(false);
  };

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "#0a0a0a", overflow: "hidden" }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        style={{ padding: "16px 20px 14px", paddingTop: `calc(16px + env(safe-area-inset-top))`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <button onClick={() => router.back()}
          style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "white", margin: 0 }}>Carnets R&A 💕</h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>{days.toLocaleString("es-ES")} días juntos</p>
        </div>
        <motion.button whileTap={{ scale: 0.92 }} onClick={() => setEditing(true)}
          style={{ padding: "7px 14px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Editar
        </motion.button>
      </motion.div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 20px", paddingBottom: "calc(32px + env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", gap: 20 }}>
        {loading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 80 }}>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>Cargando…</p>
          </div>
        ) : (
          <>
            {/* Días juntos banner */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}
              style={{ background: "linear-gradient(135deg, rgba(255,45,85,0.2) 0%, rgba(175,82,222,0.2) 100%)", border: "1px solid rgba(255,45,85,0.25)", borderRadius: 16, padding: "14px 18px", textAlign: "center" }}>
              <p style={{ fontSize: 32, fontWeight: 800, color: "white", margin: 0, letterSpacing: "-0.5px" }}>{days.toLocaleString("es-ES")}</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: "2px 0 0" }}>días juntos · desde el {formatDate(fechaInicio)}</p>
            </motion.div>

            {/* Mi carnet */}
            <FlippableCard
              name={isAlejandro ? "Alejandro" : "Rut"}
              status={isAlejandro ? "Novio oficial" : "Novia oficial"}
              photoUrl={myProfile?.photo_url ?? null}
              apodo={myProfile?.apodo ?? null}
              accentColor={isAlejandro ? "#1C1C1E" : "#FF2D55"}
              accentGlow={isAlejandro ? "#5AC8FA" : "#FF2D55"}
              isMine={true}
              uploading={uploadingPhoto}
              onPhotoClick={() => fileInputRef.current?.click()}
              coupleId="R&A · #001"
              badges={isAlejandro ? BADGES_ALEJANDRO : BADGES_RUT}
              poder={isAlejandro ? PODER_ALEJANDRO : PODER_RUT}
              time={time}
              fechaInicio={fechaInicio}
              delay={0.1}
            />

            {/* Carnet del otro */}
            <FlippableCard
              name={isAlejandro ? "Rut" : "Alejandro"}
              status={isAlejandro ? "Novia oficial" : "Novio oficial"}
              photoUrl={otherProfile?.photo_url ?? null}
              apodo={otherProfile?.apodo ?? null}
              accentColor={isAlejandro ? "#FF2D55" : "#1C1C1E"}
              accentGlow={isAlejandro ? "#FF2D55" : "#5AC8FA"}
              isMine={false}
              uploading={false}
              onPhotoClick={() => {}}
              coupleId="R&A · #002"
              badges={isAlejandro ? BADGES_RUT : BADGES_ALEJANDRO}
              poder={isAlejandro ? PODER_RUT : PODER_ALEJANDRO}
              time={time}
              fechaInicio={fechaInicio}
              delay={0.18}
            />

            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoUpload} />
          </>
        )}
      </div>

      {/* Edit sheet */}
      <AnimatePresence>
        {editing && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditing(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 40 }} />
            <motion.div
              initial={{ opacity: 0, y: 80 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#1c1c1e", borderRadius: "24px 24px 0 0", padding: "24px 20px", paddingBottom: "calc(24px + env(safe-area-inset-bottom))", zIndex: 50 }}
            >
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)", margin: "0 auto 20px" }} />
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "white", margin: "0 0 20px" }}>Editar mi carnet</h3>

              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Mi apodo (cómo me llama {isAlejandro ? "Rut" : "Alejandro"})
                </p>
                <input value={editApodo} onChange={(e) => setEditApodo(e.target.value)}
                  placeholder={`¿Cómo te llama ${isAlejandro ? "Rut" : "Alejandro"}?`}
                  style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 14px", fontSize: 15, color: "white", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>

              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Fecha de inicio</p>
                <input type="date" value={editFecha} onChange={(e) => setEditFecha(e.target.value)}
                  style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 14px", fontSize: 15, color: "white", outline: "none", fontFamily: "inherit", boxSizing: "border-box", colorScheme: "dark" }} />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setEditing(false)}
                  style={{ flex: 1, padding: "13px", background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 14, color: "rgba(255,255,255,0.6)", fontSize: 14, cursor: "pointer" }}>
                  Cancelar
                </button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving}
                  style={{ flex: 2, padding: "13px", background: "linear-gradient(135deg, #FF2D55 0%, #AF52DE 100%)", border: "none", borderRadius: 14, color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  {saving ? "Guardando…" : "Guardar"}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Flippable card ────────────────────────────────────────────────────────────

interface CardProps {
  name: string; status: string; photoUrl: string | null; apodo: string | null;
  accentColor: string; accentGlow: string; isMine: boolean; uploading: boolean;
  onPhotoClick: () => void; coupleId: string;
  badges: { icon: string; label: string }[];
  poder: string;
  time: { years: number; months: number; days: number; hours: number };
  fechaInicio: string | null;
  delay: number;
}

function FlippableCard(props: CardProps) {
  const { name, status, photoUrl, apodo, accentColor, accentGlow, isMine, uploading, onPhotoClick, coupleId, badges, poder, time, fechaInicio, delay } = props;
  const [flipped, setFlipped] = useState(false);
  const [hinted, setHinted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHinted(true), 800);
    const t2 = setTimeout(() => setHinted(false), 3000);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 24, delay }}
      style={{ position: "relative" }}
    >
      {/* Flip hint */}
      <AnimatePresence>
        {hinted && !flipped && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ position: "absolute", bottom: -22, left: 0, right: 0, textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.3)", zIndex: 2, pointerEvents: "none" }}>
            Toca para girar 🔄
          </motion.div>
        )}
      </AnimatePresence>

      {/* Perspective wrapper */}
      <div style={{ perspective: 1200 }} onClick={() => setFlipped((f) => !f)}>
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          style={{ position: "relative", transformStyle: "preserve-3d", cursor: "pointer", minHeight: 210 }}
        >
          {/* ── FRONT ── */}
          <div style={{
            backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
            position: "absolute", inset: 0,
            background: "#1c1c1e", borderRadius: 24, overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04), 0 0 40px ${accentGlow}18`,
          }}>
            <div style={{ height: 4, background: `linear-gradient(90deg, ${accentColor}, ${accentColor === "#1C1C1E" ? "#5AC8FA" : "#AF52DE"})` }} />
            <div style={{ padding: 20 }}>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                {/* Photo */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div onClick={(e) => { if (isMine) { e.stopPropagation(); onPhotoClick(); } }}
                    style={{ width: 80, height: 80, borderRadius: 16, background: photoUrl ? "transparent" : `${accentGlow}22`, border: `2px solid ${accentGlow}44`, overflow: "hidden", cursor: isMine ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    {photoUrl
                      ? <img src={photoUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontSize: 32, fontWeight: 700, color: accentGlow }}>{name[0]}</span>}
                    {isMine && uploading && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 18 }}>⏳</span>
                      </div>
                    )}
                  </div>
                  {isMine && !uploading && (
                    <div onClick={(e) => { e.stopPropagation(); onPhotoClick(); }}
                      style={{ position: "absolute", bottom: -4, right: -4, width: 22, height: 22, borderRadius: "50%", background: accentGlow, border: "2px solid #1c1c1e", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="white" strokeWidth="3" strokeLinecap="round" /></svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 6 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: "white", margin: 0 }}>{name}</h2>
                    {isMine && <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.07)", padding: "3px 7px", borderRadius: 10, letterSpacing: "0.04em" }}>TÚ</span>}
                  </div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: `${accentGlow}22`, border: `1px solid ${accentGlow}44`, borderRadius: 20, padding: "4px 10px", marginBottom: 10 }}>
                    <span style={{ fontSize: 10 }}>❤️</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: accentGlow }}>{status}</span>
                  </div>
                  {apodo && (
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: 0 }}>
                      <span style={{ color: "rgba(255,255,255,0.25)" }}>Le llaman </span>
                      <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600, fontStyle: "italic" }}>"{apodo}"</span>
                    </p>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34C759" }} />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>R&A App · Pareja verificada</span>
                </div>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontWeight: 600, letterSpacing: "0.04em" }}>{coupleId}</span>
              </div>
            </div>
          </div>

          {/* ── BACK ── */}
          <div style={{
            backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            position: "absolute", inset: 0,
            background: "linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #1c1c1e 100%)",
            borderRadius: 24, overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 40px ${accentGlow}18`,
            padding: 20,
            display: "flex", flexDirection: "column", gap: 14,
          }}>
            {/* Decorative dots */}
            <div style={{ position: "absolute", top: 12, right: 16, display: "flex", gap: 4 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: i === 0 ? "#FF2D55" : i === 1 ? "#FF9F0A" : "#34C759", opacity: 0.6 }} />
              ))}
            </div>

            {/* Nombre pequeño */}
            <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>{name} · reverso</p>

            {/* Tiempo desglosado */}
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { val: time.years, label: "años" },
                { val: time.months, label: "meses" },
                { val: time.days, label: "días" },
              ].map(({ val, label }) => (
                <div key={label} style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "10px 6px", textAlign: "center" }}>
                  <p style={{ fontSize: 22, fontWeight: 800, color: "white", margin: 0 }}>{val}</p>
                  <p style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", margin: 0, fontWeight: 600, textTransform: "uppercase" }}>{label}</p>
                </div>
              ))}
              <div style={{ flex: 1.4, background: `${accentGlow}15`, border: `1px solid ${accentGlow}30`, borderRadius: 12, padding: "10px 6px", textAlign: "center" }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: accentGlow, margin: 0 }}>{time.hours.toLocaleString("es-ES")}</p>
                <p style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", margin: 0, fontWeight: 600, textTransform: "uppercase" }}>horas</p>
              </div>
            </div>

            {/* Badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {badges.map((b) => (
                <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "4px 10px" }}>
                  <span style={{ fontSize: 12 }}>{b.icon}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>{b.label}</span>
                </div>
              ))}
            </div>

            {/* Poder especial */}
            <div style={{ background: `linear-gradient(135deg, ${accentGlow}15, transparent)`, border: `1px solid ${accentGlow}25`, borderRadius: 14, padding: "10px 12px" }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: accentGlow, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>⚡ Poder especial</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>"{poder}"</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

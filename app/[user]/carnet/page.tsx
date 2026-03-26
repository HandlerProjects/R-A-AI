"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore, UserName } from "@/store/userStore";
import { getBothProfiles, upsertProfile, type UserProfile } from "@/lib/profiles";
import { uploadPhoto } from "@/lib/upload";

const COUPLE_DATE = "2025-01-30";
const MEET_DATE = "2024-11-14";

function daysTogether(fechaInicio: string | null): number {
  if (!fechaInicio) return 0;
  const start = new Date(fechaInicio);
  return Math.floor((new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
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

// Decorative QR code SVG
function QRDecor({ size = 48, color = "rgba(255,255,255,0.5)" }: { size?: number; color?: string }) {
  const s = size / 7;
  const blocks = [
    [0,0],[1,0],[2,0],[0,1],[2,1],[0,2],[1,2],[2,2],
    [4,0],[5,0],[6,0],[4,1],[6,1],[4,2],[5,2],[6,2],
    [0,4],[1,4],[2,4],[0,5],[2,5],[0,6],[1,6],[2,6],
    [3,3],[4,4],[5,5],[6,6],[3,5],[5,3],[4,6],[6,4],[3,4],
  ];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {blocks.map(([x, y], i) => (
        <rect key={i} x={x * s} y={y * s} width={s - 0.5} height={s - 0.5} fill={color} rx={0.5} />
      ))}
      <rect x={s * 1} y={s * 1} width={s} height={s} fill={color} rx={0.3} />
      <rect x={s * 5} y={s * 1} width={s} height={s} fill={color} rx={0.3} />
      <rect x={s * 1} y={s * 5} width={s} height={s} fill={color} rx={0.3} />
    </svg>
  );
}

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
  const [editFecha, setEditFecha] = useState(COUPLE_DATE);
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
  const daysKnown = daysTogether(MEET_DATE);

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
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>{days.toLocaleString("es-ES")} días juntos · {daysKnown.toLocaleString("es-ES")} de habernos conocido</p>
        </div>
        <motion.button whileTap={{ scale: 0.92 }} onClick={() => setEditing(true)}
          style={{ padding: "7px 14px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Editar
        </motion.button>
      </motion.div>

      {/* Cards list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 20px", paddingBottom: "calc(32px + env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", gap: 24 }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: 80 }}>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>Cargando…</p>
          </div>
        ) : (
          <>
            <FlippableCard
              name={isAlejandro ? "Alejandro" : "Rut"}
              status={isAlejandro ? "NOVIO OFICIAL" : "NOVIA OFICIAL"}
              photoUrl={myProfile?.photo_url ?? null}
              apodo={myProfile?.apodo ?? null}
              gradientFrom={isAlejandro ? "#0f2027" : "#1a0010"}
              gradientTo={isAlejandro ? "#203a43" : "#3d0022"}
              chipColor={isAlejandro ? "#5AC8FA" : "#FF2D55"}
              isMine={true}
              uploading={uploadingPhoto}
              onPhotoClick={() => fileInputRef.current?.click()}
              coupleId={isAlejandro ? "R&A-001" : "R&A-002"}
              badges={isAlejandro ? BADGES_ALEJANDRO : BADGES_RUT}
              poder={isAlejandro ? PODER_ALEJANDRO : PODER_RUT}
              time={time}
              delay={0.05}
            />

            <FlippableCard
              name={isAlejandro ? "Rut" : "Alejandro"}
              status={isAlejandro ? "NOVIA OFICIAL" : "NOVIO OFICIAL"}
              photoUrl={otherProfile?.photo_url ?? null}
              apodo={otherProfile?.apodo ?? null}
              gradientFrom={isAlejandro ? "#1a0010" : "#0f2027"}
              gradientTo={isAlejandro ? "#3d0022" : "#203a43"}
              chipColor={isAlejandro ? "#FF2D55" : "#5AC8FA"}
              isMine={false}
              uploading={false}
              onPhotoClick={() => {}}
              coupleId={isAlejandro ? "R&A-002" : "R&A-001"}
              badges={isAlejandro ? BADGES_RUT : BADGES_ALEJANDRO}
              poder={isAlejandro ? PODER_RUT : PODER_ALEJANDRO}
              time={time}
              delay={0.12}
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
              style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#1c1c1e", borderRadius: "24px 24px 0 0", padding: "24px 20px", paddingBottom: "calc(24px + env(safe-area-inset-bottom))", zIndex: 50 }}>
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
                <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Fecha de inicio de la relación</p>
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

// ── Flippable ID Card ─────────────────────────────────────────────────────────

interface CardProps {
  name: string; status: string; photoUrl: string | null; apodo: string | null;
  gradientFrom: string; gradientTo: string; chipColor: string;
  isMine: boolean; uploading: boolean; onPhotoClick: () => void; coupleId: string;
  badges: { icon: string; label: string }[];
  poder: string;
  time: { years: number; months: number; days: number; hours: number };
  delay: number;
}

function FlippableCard(props: CardProps) {
  const { name, status, photoUrl, apodo, gradientFrom, gradientTo, chipColor, isMine, uploading, onPhotoClick, coupleId, badges, poder, time, delay } = props;
  const [flipped, setFlipped] = useState(false);
  const [hinted, setHinted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHinted(true), 1000 + delay * 1000);
    const t2 = setTimeout(() => setHinted(false), 3500 + delay * 1000);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, [delay]);

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 26, delay }}
      style={{ position: "relative" }}>

      {/* Tap hint */}
      <AnimatePresence>
        {hinted && !flipped && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "absolute", bottom: -20, left: 0, right: 0, textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.28)", pointerEvents: "none", zIndex: 2 }}>
            Toca para ver el reverso 🔄
          </motion.p>
        )}
      </AnimatePresence>

      <div style={{ perspective: 1400 }} onClick={() => setFlipped((f) => !f)}>
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 30 }}
          style={{ position: "relative", transformStyle: "preserve-3d", cursor: "pointer" }}>

          {/* ══ FRONT ══ */}
          <div style={{
            backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
            background: `linear-gradient(145deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
            borderRadius: 20, overflow: "hidden",
            boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.07), 0 0 80px ${chipColor}20`,
            minHeight: 200,
          }}>

            {/* Diagonal shimmer overlay */}
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: `repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(255,255,255,0.015) 40px, rgba(255,255,255,0.015) 80px)`,
            }} />

            {/* Top bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px 10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: chipColor, boxShadow: `0 0 8px ${chipColor}` }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.9)", letterSpacing: "0.12em" }}>R&A APP</span>
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>CARNET OFICIAL</span>
            </div>

            {/* Main content */}
            <div style={{ display: "flex", gap: 16, padding: "6px 18px 16px", alignItems: "center" }}>

              {/* Photo */}
              <div style={{ flexShrink: 0, position: "relative" }}
                onClick={(e) => { if (isMine) { e.stopPropagation(); onPhotoClick(); } }}>
                <div style={{
                  width: 90, height: 110, borderRadius: 12, overflow: "hidden",
                  background: `linear-gradient(145deg, ${chipColor}30, ${chipColor}10)`,
                  border: `2px solid ${chipColor}60`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: isMine ? "pointer" : "default",
                  position: "relative",
                }}>
                  {photoUrl
                    ? <img src={photoUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: 38, fontWeight: 800, color: chipColor, opacity: 0.8 }}>{name[0]}</span>}
                  {isMine && uploading && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 20 }}>⏳</span>
                    </div>
                  )}
                </div>
                {isMine && !uploading && (
                  <motion.div whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); onPhotoClick(); }}
                    style={{ position: "absolute", bottom: -6, right: -6, width: 24, height: 24, borderRadius: "50%", background: chipColor, border: "2px solid #0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: `0 2px 8px ${chipColor}80` }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="white" strokeWidth="3" strokeLinecap="round" /></svg>
                  </motion.div>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {isMine && (
                  <div style={{ display: "inline-block", background: `${chipColor}25`, border: `1px solid ${chipColor}50`, borderRadius: 6, padding: "2px 8px", marginBottom: 8 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: chipColor, letterSpacing: "0.1em" }}>TU CARNET</span>
                  </div>
                )}
                <h2 style={{ fontSize: 22, fontWeight: 900, color: "white", margin: "0 0 4px", letterSpacing: "-0.3px" }}>{name}</h2>

                {apodo && (
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 10px", fontStyle: "italic" }}>"{apodo}"</p>
                )}

                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: `${chipColor}20`, border: `1px solid ${chipColor}40`, borderRadius: 20, padding: "5px 12px", marginBottom: 12 }}>
                  <span style={{ fontSize: 10 }}>❤️</span>
                  <span style={{ fontSize: 10, fontWeight: 800, color: chipColor, letterSpacing: "0.06em" }}>{status}</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 600, letterSpacing: "0.05em", minWidth: 52 }}>EXPEDIDO</span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>30 ene 2025</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 600, letterSpacing: "0.05em", minWidth: 52 }}>Nº</span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.08em" }}>{coupleId}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div style={{ background: "rgba(0,0,0,0.3)", padding: "10px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#34C759", boxShadow: "0 0 6px #34C759" }} />
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: "0.04em" }}>PAREJA VERIFICADA</span>
              </div>
              <QRDecor size={38} color={`${chipColor}70`} />
            </div>
          </div>

          {/* ══ BACK ══ */}
          <div style={{
            backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            position: "absolute", inset: 0,
            background: `linear-gradient(145deg, #111118 0%, #1a1a28 100%)`,
            borderRadius: 20, overflow: "hidden",
            boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.07)`,
            padding: 18, display: "flex", flexDirection: "column", gap: 12,
          }}>
            {/* Stripe */}
            <div style={{ position: "absolute", top: 32, left: 0, right: 0, height: 36, background: "rgba(0,0,0,0.6)" }} />
            {/* Signature strip */}
            <div style={{ position: "absolute", top: 82, left: 18, right: 18, height: 28, background: "rgba(255,255,255,0.06)", borderRadius: 4 }}>
              <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: `${chipColor}80`, fontStyle: "italic", fontFamily: "serif" }}>{name}</span>
            </div>

            <div style={{ marginTop: 120 }}>
              {/* Tiempo desglosado */}
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {[
                  { val: time.years, label: "años" },
                  { val: time.months, label: "meses" },
                  { val: time.days, label: "días" },
                  { val: time.hours.toLocaleString("es-ES"), label: "horas" },
                ].map(({ val, label }) => (
                  <div key={label} style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "8px 4px", textAlign: "center", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p style={{ fontSize: label === "horas" ? 10 : 20, fontWeight: 800, color: label === "horas" ? chipColor : "white", margin: 0, lineHeight: 1 }}>{val}</p>
                    <p style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", margin: "3px 0 0", fontWeight: 700, textTransform: "uppercase" }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Badges */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
                {badges.map((b) => (
                  <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "4px 9px" }}>
                    <span style={{ fontSize: 11 }}>{b.icon}</span>
                    <span style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>{b.label}</span>
                  </div>
                ))}
              </div>

              {/* Poder especial */}
              <div style={{ background: `linear-gradient(135deg, ${chipColor}12, transparent)`, border: `1px solid ${chipColor}20`, borderRadius: 12, padding: "10px 12px" }}>
                <p style={{ fontSize: 8, fontWeight: 800, color: chipColor, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>⚡ Poder especial</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>"{poder}"</p>
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </motion.div>
  );
}

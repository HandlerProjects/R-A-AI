"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore, UserName } from "@/store/userStore";
import { getBothProfiles, upsertProfile, type UserProfile } from "@/lib/profiles";
import { uploadPhoto } from "@/lib/upload";
import {
  getSaldos, getHistorial, getAcciones, aplicarAccion, addAccion, deleteAccion,
  type PuntosAccion, type PuntosHistorial,
} from "@/lib/puntos";

const COUPLE_DATE = "2026-01-30";
const MEET_DATE   = "2025-11-14";
const ORANGE      = "#ea580c";
const MAX         = 30;

function daysSince(d: string | null) {
  if (!d) return 0;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
}
function breakdown(d: string | null) {
  if (!d) return { y: 0, m: 0, days: 0, h: 0 };
  const s = new Date(d), n = new Date();
  let y = n.getFullYear() - s.getFullYear();
  let m = n.getMonth()    - s.getMonth();
  let days = n.getDate()  - s.getDate();
  if (days < 0) { m--;  days += new Date(n.getFullYear(), n.getMonth(), 0).getDate(); }
  if (m < 0)    { y--;  m += 12; }
  return { y, m, days, h: Math.floor((n.getTime() - s.getTime()) / 3_600_000) };
}
function fmtShort(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function fmtHist(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" }) + " · " +
    d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

const TIPO_CFG = {
  ganar:     { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", label: "GANAR",     icon: "⬆️" },
  perder:    { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "PERDER",    icon: "⬇️" },
  recuperar: { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", label: "RECUPERAR", icon: "🔄" },
};

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

/* ─── Page ──────────────────────────────────────────────────────────────────── */
export default function CarnetPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeUser, setUser } = useUserStore();
  const user = params.user as UserName;
  useEffect(() => { if (user !== activeUser) setUser(user, user); }, [user]);

  const isAle      = user === "alejandro";
  const myName     = isAle ? "Alejandro" : "Rut";
  const otherName  = isAle ? "Rut" : "Alejandro";
  const otherUser  = isAle ? "rut" : "alejandro";

  const initialTab = searchParams.get("tab") === "puntos" ? "puntos" : "carnets";
  const [tab, setTab] = useState<"carnets" | "puntos">(initialTab);

  // ── Carnets state ──
  const [profiles,  setProfiles]  = useState<{ alejandro: UserProfile | null; rut: UserProfile | null }>({ alejandro: null, rut: null });
  const [loadingC,  setLoadingC]  = useState(true);
  const [editing,   setEditing]   = useState(false);
  const [apodo,     setApodo]     = useState("");
  const [fecha,     setFecha]     = useState(COUPLE_DATE);
  const [savingC,   setSavingC]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Puntos state ──
  const [saldos,    setSaldos]    = useState({ alejandro: 0, rut: 0 });
  const [historial, setHistorial] = useState<PuntosHistorial[]>([]);
  const [acciones,  setAcciones]  = useState<PuntosAccion[]>([]);
  const [loadingP,  setLoadingP]  = useState(true);
  const [subTab,    setSubTab]    = useState<"aplicar" | "historial" | "lista">("aplicar");
  const [selected,  setSelected]  = useState<PuntosAccion | null>(null);
  const [target,    setTarget]    = useState(user);
  const [applying,  setApplying]  = useState(false);
  const [flash,     setFlash]     = useState<{ msg: string; ok: boolean } | null>(null);
  const [showForm,  setShowForm]  = useState(false);
  const [formText,  setFormText]  = useState("");
  const [formValor, setFormValor] = useState("1");
  const [formTipo,  setFormTipo]  = useState<"ganar" | "perder" | "recuperar">("ganar");
  const [savingP,   setSavingP]   = useState(false);

  useEffect(() => {
    getBothProfiles().then((p) => {
      setProfiles(p); setLoadingC(false);
      const mine = user === "alejandro" ? p.alejandro : p.rut;
      setApodo(mine?.apodo ?? "");
      setFecha(mine?.fecha_inicio ?? COUPLE_DATE);
    });
  }, [user]);

  const loadPuntos = async () => {
    const [s, h, a] = await Promise.all([getSaldos(), getHistorial(), getAcciones()]);
    setSaldos(s); setHistorial(h); setAcciones(a); setLoadingP(false);
  };
  useEffect(() => { loadPuntos(); }, []);

  const mine        = isAle ? profiles.alejandro : profiles.rut;
  const other       = isAle ? profiles.rut : profiles.alejandro;
  const fi          = mine?.fecha_inicio ?? other?.fecha_inicio ?? COUPLE_DATE;
  const days        = daysSince(fi);
  const bd          = breakdown(fi);
  const myPuntos    = isAle ? saldos.alejandro : saldos.rut;
  const otherPuntos = isAle ? saldos.rut : saldos.alejandro;

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const url = await uploadPhoto(file, `perfiles/${user}`);
    if (url) { await upsertProfile(user, { photo_url: url }); setProfiles(await getBothProfiles()); }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSaveCarnet = async () => {
    setSavingC(true);
    await upsertProfile(user, { apodo: apodo.trim() || null, fecha_inicio: fecha || null });
    await upsertProfile(otherUser, { fecha_inicio: fecha || null });
    setProfiles(await getBothProfiles());
    setEditing(false); setSavingC(false);
  };

  const handleApply = async () => {
    if (!selected) return;
    setApplying(true);
    await aplicarAccion(otherUser, user, selected);
    await loadPuntos();
    setFlash({ msg: `${selected.valor > 0 ? "+" : ""}${selected.valor} pts para ${otherName} · ${selected.texto}`, ok: selected.valor > 0 });
    setTimeout(() => setFlash(null), 3000);
    setSelected(null); setApplying(false);
  };

  const handleAddAccion = async () => {
    if (!formText.trim()) return;
    setSavingP(true);
    const val = parseInt(formValor) || 1;
    await addAccion(formText.trim(), formTipo === "perder" ? -Math.abs(val) : Math.abs(val), formTipo);
    await loadPuntos();
    setFormText(""); setFormValor("1"); setShowForm(false); setSavingP(false);
  };

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "#f9fafb", overflow: "hidden" }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        style={{ padding: "14px 20px", paddingTop: `calc(14px + env(safe-area-inset-top))`, background: "white", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.back()}
            style={{ width: 34, height: 34, borderRadius: "50%", background: "#f3f4f6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0 }}>R&A 💕</h1>
            <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{days.toLocaleString("es-ES")} días juntos</p>
          </div>
          {tab === "carnets" && (
            <button onClick={() => setEditing(true)}
              style={{ padding: "7px 14px", background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 20, color: "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              Editar
            </button>
          )}
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: 0, marginTop: 12, background: "#f3f4f6", borderRadius: 10, padding: 3 }}>
          {(["carnets", "puntos"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex: 1, padding: "8px", background: tab === t ? "white" : "transparent", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, color: tab === t ? "#111827" : "#9ca3af", cursor: "pointer", boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none", transition: "all 0.15s" }}>
              {t === "carnets" ? "💕 Carnets" : "⚡ Puntos"}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ══ CARNETS TAB ══ */}
      {tab === "carnets" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", paddingBottom: "calc(32px + env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", gap: 28 }}>
          {loadingC ? (
            <p style={{ color: "#9ca3af", fontSize: 14, textAlign: "center", marginTop: 80 }}>Cargando…</p>
          ) : (
            <>
              <DNICard
                name="Alejandro" status="NOVIO OFICIAL"
                photoUrl={isAle ? mine?.photo_url ?? null : other?.photo_url ?? null}
                apodo={isAle ? mine?.apodo ?? null : other?.apodo ?? null}
                cardId="R&A-001" accentColor={ORANGE}
                isMine={isAle} uploading={isAle ? uploading : false}
                onPhoto={isAle ? () => fileRef.current?.click() : () => {}}
                badges={BADGES.alejandro} poder={PODER.alejandro} bd={bd} delay={0.05}
              />
              <DNICard
                name="Rut" status="NOVIA OFICIAL"
                photoUrl={isAle ? other?.photo_url ?? null : mine?.photo_url ?? null}
                apodo={isAle ? other?.apodo ?? null : mine?.apodo ?? null}
                cardId="R&A-002" accentColor={ORANGE}
                isMine={!isAle} uploading={!isAle ? uploading : false}
                onPhoto={!isAle ? () => fileRef.current?.click() : () => {}}
                badges={BADGES.rut} poder={PODER.rut} bd={bd} delay={0.13}
              />
              <input ref={fileRef} id="ra-photo-input" type="file" accept="image/*"
                style={{ position: "absolute", opacity: 0, width: 1, height: 1, pointerEvents: "none" }}
                onChange={handlePhoto} />
            </>
          )}
        </div>
      )}

      {/* ══ PUNTOS TAB ══ */}
      {tab === "puntos" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Flash */}
          <AnimatePresence>
            {flash && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ margin: "10px 16px 0", padding: "10px 14px", borderRadius: 10, background: flash.ok ? "#f0fdf4" : "#fef2f2", border: `1px solid ${flash.ok ? "#bbf7d0" : "#fecaca"}`, textAlign: "center", flexShrink: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: flash.ok ? "#16a34a" : "#dc2626", margin: 0 }}>{flash.msg}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Score cards */}
          <div style={{ padding: "12px 16px 0", display: "flex", gap: 10, flexShrink: 0 }}>
            {[{ name: myName, puntos: myPuntos, isMe: true }, { name: otherName, puntos: otherPuntos, isMe: false }].map(({ name, puntos, isMe }) => {
              const capped = Math.min(puntos, MAX);
              const bonus  = Math.max(0, puntos - MAX);
              return (
                <motion.div key={name} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: isMe ? 0.05 : 0.1 }}
                  style={{ flex: 1, background: "white", borderRadius: 14, padding: 14, border: isMe ? `2px solid ${ORANGE}30` : "1px solid #e5e7eb", boxShadow: isMe ? `0 2px 12px ${ORANGE}15` : "0 1px 4px rgba(0,0,0,0.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", margin: 0 }}>{name}</p>
                    {isMe && <span style={{ fontSize: 9, fontWeight: 800, color: ORANGE, background: `${ORANGE}15`, padding: "2px 7px", borderRadius: 8 }}>TÚ</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                    <span style={{ fontSize: 30, fontWeight: 900, color: "#111827", lineHeight: 1 }}>{capped}</span>
                    <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>/ {MAX}</span>
                    {bonus > 0 && <span style={{ fontSize: 10, fontWeight: 800, color: ORANGE, background: `${ORANGE}15`, padding: "1px 6px", borderRadius: 8, marginLeft: 4 }}>+{bonus}</span>}
                  </div>
                  <div style={{ height: 5, background: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(capped / MAX) * 100}%` }}
                      transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
                      style={{ height: "100%", background: `linear-gradient(90deg, ${ORANGE}, #f97316)`, borderRadius: 3 }} />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Sub-tabs */}
          <div style={{ display: "flex", gap: 0, margin: "10px 16px 0", background: "#f3f4f6", borderRadius: 10, padding: 3, flexShrink: 0 }}>
            {(["aplicar", "historial", "lista"] as const).map((t) => (
              <button key={t} onClick={() => setSubTab(t)}
                style={{ flex: 1, padding: "7px 4px", background: subTab === t ? "white" : "transparent", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 700, color: subTab === t ? "#111827" : "#9ca3af", cursor: "pointer", boxShadow: subTab === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none", transition: "all 0.15s" }}>
                {t === "aplicar" ? "⚡ Aplicar" : t === "historial" ? "📋 Historial" : "⚙️ Lista"}
              </button>
            ))}
          </div>

          {/* Sub-tab content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", paddingBottom: "calc(24px + env(safe-area-inset-bottom))" }}>

            {/* APLICAR */}
            {subTab === "aplicar" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {(["ganar", "recuperar", "perder"] as const).map((tipo) => {
                  const cfg   = TIPO_CFG[tipo];
                  const lista = acciones.filter((a) => a.tipo === tipo);
                  if (!lista.length) return null;
                  return (
                    <div key={tipo}>
                      <p style={{ fontSize: 10, fontWeight: 800, color: cfg.color, margin: "0 0 8px", letterSpacing: "0.08em", textTransform: "uppercase" }}>{cfg.icon} {cfg.label} PUNTOS</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {lista.map((a) => {
                          const isSel = selected?.id === a.id;
                          return (
                            <div key={a.id}>
                              <motion.button whileTap={{ scale: 0.98 }}
                                onClick={() => setSelected(isSel ? null : a)}
                                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: isSel ? cfg.bg : "white", border: `1.5px solid ${isSel ? cfg.color : "#e5e7eb"}`, borderRadius: 10, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                                <span style={{ fontSize: 14, fontWeight: 600, color: "#111827", flex: 1 }}>{a.texto}</span>
                                <span style={{ fontSize: 13, fontWeight: 800, color: cfg.color, marginLeft: 10 }}>{a.valor > 0 ? "+" : ""}{a.valor} pts</span>
                              </motion.button>
                              <AnimatePresence>
                                {isSel && (
                                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
                                    <div style={{ padding: "10px 14px 14px", background: cfg.bg, borderRadius: "0 0 10px 10px", border: `1.5px solid ${cfg.color}`, borderTop: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                                      <p style={{ fontSize: 12, color: cfg.color, margin: 0, fontWeight: 600 }}>
                                        Para <strong>{otherName}</strong>
                                      </p>
                                      <motion.button whileTap={{ scale: 0.97 }} onClick={handleApply} disabled={applying}
                                        style={{ padding: 11, background: cfg.color, border: "none", borderRadius: 10, color: "white", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
                                        {applying ? "Aplicando…" : `Dar ${a.valor > 0 ? "+" : ""}${a.valor} pts a ${otherName}`}
                                      </motion.button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* HISTORIAL */}
            {subTab === "historial" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {!historial.length ? (
                  <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 14, marginTop: 40 }}>Aún no hay movimientos</p>
                ) : historial.map((h) => {
                  const isPos = h.valor > 0;
                  const tLabel = h.user_name === user ? myName : otherName;
                  const byLabel = h.applied_by === user ? "tú" : otherName;
                  return (
                    <motion.div key={h.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      style={{ background: "white", borderRadius: 10, padding: "12px 14px", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: isPos ? "#f0fdf4" : "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: isPos ? "#16a34a" : "#dc2626" }}>{isPos ? "+" : ""}{h.valor}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>{h.motivo}</p>
                        <p style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0" }}>Para {tLabel} · por {byLabel} · {fmtHist(h.created_at)}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* LISTA */}
            {subTab === "lista" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {!showForm ? (
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowForm(true)}
                    style={{ padding: 12, background: "white", border: `2px dashed ${ORANGE}50`, borderRadius: 12, color: ORANGE, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                    + Nueva acción
                  </motion.button>
                ) : (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    style={{ background: "white", borderRadius: 12, padding: 16, border: `1px solid ${ORANGE}30` }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: ORANGE, margin: "0 0 12px", textTransform: "uppercase" }}>Nueva acción</p>
                    <input value={formText} onChange={(e) => setFormText(e.target.value)} placeholder="Descripción…"
                      style={{ width: "100%", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "#111827", outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 10 }} />
                    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                      <select value={formTipo} onChange={(e) => setFormTipo(e.target.value as "ganar" | "perder" | "recuperar")}
                        style={{ flex: 1, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "9px 10px", fontSize: 13, color: "#111827", outline: "none", fontFamily: "inherit" }}>
                        <option value="ganar">⬆️ Ganar</option>
                        <option value="perder">⬇️ Perder</option>
                        <option value="recuperar">🔄 Recuperar</option>
                      </select>
                      <input type="number" min="1" max="10" value={formValor} onChange={(e) => setFormValor(e.target.value)}
                        style={{ width: 72, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "9px 10px", fontSize: 13, color: "#111827", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: 10, background: "#f3f4f6", border: "none", borderRadius: 8, color: "#6b7280", fontSize: 13, cursor: "pointer" }}>Cancelar</button>
                      <button onClick={handleAddAccion} disabled={savingP || !formText.trim()} style={{ flex: 2, padding: 10, background: ORANGE, border: "none", borderRadius: 8, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{savingP ? "Guardando…" : "Añadir"}</button>
                    </div>
                  </motion.div>
                )}
                {(["ganar", "recuperar", "perder"] as const).map((tipo) => {
                  const cfg   = TIPO_CFG[tipo];
                  const lista = acciones.filter((a) => a.tipo === tipo);
                  if (!lista.length) return null;
                  return (
                    <div key={tipo}>
                      <p style={{ fontSize: 10, fontWeight: 800, color: cfg.color, margin: "0 0 8px", letterSpacing: "0.08em", textTransform: "uppercase" }}>{cfg.icon} {cfg.label}</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {lista.map((a) => (
                          <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "white", borderRadius: 10, padding: "11px 14px", border: "1px solid #e5e7eb" }}>
                            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#374151" }}>{a.texto}</span>
                            <span style={{ fontSize: 12, fontWeight: 800, color: cfg.color, whiteSpace: "nowrap" }}>{a.valor > 0 ? "+" : ""}{a.valor} pts</span>
                            <button onClick={() => deleteAccion(a.id).then(loadPuntos)}
                              style={{ width: 28, height: 28, borderRadius: "50%", background: "#fef2f2", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" /></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit sheet */}
      <AnimatePresence>
        {editing && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditing(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40 }} />
            <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "white", borderRadius: "20px 20px 0 0", padding: "24px 20px", paddingBottom: "calc(24px + env(safe-area-inset-bottom))", zIndex: 50 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "#e5e7eb", margin: "0 auto 20px" }} />
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "#111827", margin: "0 0 18px" }}>Editar mi carnet</h3>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>Mi apodo</label>
              <input value={apodo} onChange={(e) => setApodo(e.target.value)} placeholder={`¿Cómo te llama ${otherName}?`}
                style={{ display: "block", width: "100%", marginTop: 6, marginBottom: 14, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 14px", fontSize: 15, color: "#111827", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
              <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>Fecha de inicio</label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
                style={{ display: "block", width: "100%", marginTop: 6, marginBottom: 22, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 14px", fontSize: 15, color: "#111827", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setEditing(false)} style={{ flex: 1, padding: 13, background: "#f3f4f6", border: "none", borderRadius: 12, color: "#6b7280", fontSize: 14, cursor: "pointer" }}>Cancelar</button>
                <button onClick={handleSaveCarnet} disabled={savingC} style={{ flex: 2, padding: 13, background: ORANGE, border: "none", borderRadius: 12, color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>{savingC ? "Guardando…" : "Guardar"}</button>
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
  name: string; status: string; photoUrl: string | null; apodo: string | null;
  cardId: string; accentColor: string; isMine: boolean; uploading: boolean; onPhoto: () => void;
  badges: { icon: string; label: string }[]; poder: string;
  bd: { y: number; m: number; days: number; h: number }; delay: number;
}

function DNICard(p: DNIProps) {
  const [flipped, setFlipped] = useState(false);
  const [hint, setHint] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setHint(true),  1400 + p.delay * 500);
    const t2 = setTimeout(() => setHint(false), 3800 + p.delay * 500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 24, delay: p.delay }}
      style={{ position: "relative" }}>
      <AnimatePresence>
        {hint && !flipped && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "absolute", bottom: -20, width: "100%", textAlign: "center", fontSize: 11, color: "#9ca3af", pointerEvents: "none", zIndex: 2 }}>
            Toca para ver el reverso 🔄
          </motion.p>
        )}
      </AnimatePresence>
      <div style={{ perspective: 1400 }} onClick={() => setFlipped((f) => !f)}>
        <motion.div animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 28 }}
          style={{ position: "relative", transformStyle: "preserve-3d", cursor: "pointer" }}>

          {/* FRONT */}
          <div style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", borderRadius: 10, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.1)", background: "white", position: "relative" }}>
            <div style={{ position: "absolute", bottom: -60, left: -60, width: 220, height: 220, borderRadius: "50%", background: p.accentColor, opacity: 0.08, pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -30, left: -30, width: 130, height: 130, borderRadius: "50%", background: p.accentColor, opacity: 0.06, pointerEvents: "none" }} />
            <div style={{ background: p.accentColor, padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "white", letterSpacing: "0.1em" }}>R&A · SISTEMA DE PAREJA</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.75)", letterSpacing: "0.06em" }}>CARNET OFICIAL</span>
            </div>
            <div style={{ display: "flex", gap: 14, padding: "14px 14px 10px" }}>
              <div style={{ flexShrink: 0 }}>
                <div style={{ width: 80, height: 100, borderRadius: 4, overflow: "hidden", background: "#f3f4f6", border: `2px solid ${p.accentColor}30`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", flexShrink: 0 }}>
                  {p.photoUrl
                    ? <img src={p.photoUrl} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                    : <svg width="40" height="48" viewBox="0 0 40 48" fill="none"><circle cx="20" cy="16" r="10" fill={p.accentColor} opacity="0.3" /><path d="M2 46c0-9.94 8.06-18 18-18s18 8.06 18 18" stroke={p.accentColor} strokeWidth="2" opacity="0.3" fill="none" /></svg>}
                  {p.isMine && p.uploading && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 18 }}>⏳</span></div>
                  )}
                </div>
                {p.isMine && !p.uploading && (
                  <label htmlFor="ra-photo-input" onClick={(e) => e.stopPropagation()}
                    style={{ display: "block", width: "100%", marginTop: 5, fontSize: 8, fontWeight: 700, color: "white", background: p.accentColor, borderRadius: 3, padding: "4px 0", cursor: "pointer", letterSpacing: "0.04em", textAlign: "center" }}>
                    CAMBIAR FOTO
                  </label>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {p.isMine && <span style={{ fontSize: 8, fontWeight: 800, color: "white", background: p.accentColor, padding: "2px 7px", borderRadius: 3, letterSpacing: "0.06em", marginBottom: 6, display: "inline-block" }}>TU CARNET</span>}
                <p style={{ fontSize: 8, color: "#9ca3af", fontWeight: 700, margin: `${p.isMine ? "4px" : "0"} 0 1px`, letterSpacing: "0.08em" }}>NOMBRE COMPLETO</p>
                <p style={{ fontSize: 17, fontWeight: 900, color: "#111827", margin: "0 0 2px", lineHeight: 1.1 }}>{p.name}</p>
                {p.apodo && <p style={{ fontSize: 10, color: "#6b7280", margin: "0 0 8px", fontStyle: "italic" }}>"{p.apodo}"</p>}
                <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: `${p.accentColor}12`, border: `1.5px solid ${p.accentColor}35`, borderRadius: 4, padding: "3px 8px", marginBottom: 10 }}>
                  <span style={{ fontSize: 8 }}>❤️</span>
                  <span style={{ fontSize: 8, fontWeight: 900, color: p.accentColor, letterSpacing: "0.1em" }}>{p.status}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 10px" }}>
                  <DataField label="EXPEDICIÓN" value={fmtShort(COUPLE_DATE)} />
                  <DataField label="Nº CARNET"  value={p.cardId} />
                  <DataField label="CONOCIDOS"  value={fmtShort(MEET_DATE)} />
                  <DataField label="ESTADO"     value="✓ Verificado" color="#16a34a" />
                </div>
              </div>
            </div>
            <div style={{ background: "#f9fafb", borderTop: "1px solid #e5e7eb", padding: "6px 14px" }}>
              <p style={{ fontFamily: "monospace", fontSize: 8, color: "#9ca3af", margin: 0, letterSpacing: "0.1em" }}>{mrzLine(p.name, p.cardId)}</p>
              <p style={{ fontFamily: "monospace", fontSize: 8, color: "#9ca3af", margin: "1px 0 0", letterSpacing: "0.1em" }}>{"RA<<PAREJA<<OFICIAL<<" + p.cardId.replace("-", "") + "<<<<<<"}</p>
            </div>
          </div>

          {/* BACK */}
          <div style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)", position: "absolute", inset: 0, borderRadius: 10, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.18)", background: "white", display: "flex", flexDirection: "column" }}>
            <div style={{ height: 36, background: "#1f2937", flexShrink: 0 }} />
            <div style={{ margin: "10px 14px 0", height: 28, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 3, display: "flex", alignItems: "center", paddingLeft: 10 }}>
              <span style={{ fontFamily: "serif", fontSize: 14, color: p.accentColor, fontStyle: "italic", opacity: 0.8 }}>{p.name}</span>
            </div>
            <div style={{ flex: 1, padding: "10px 14px 12px", display: "flex", flexDirection: "column", gap: 10, overflow: "hidden" }}>
              <div style={{ position: "absolute", bottom: -50, right: -50, width: 160, height: 160, borderRadius: "50%", background: p.accentColor, opacity: 0.06, pointerEvents: "none" }} />
              <div style={{ display: "flex", gap: 6 }}>
                {[{ val: p.bd.y, label: "AÑOS" }, { val: p.bd.m, label: "MESES" }, { val: p.bd.days, label: "DÍAS" }, { val: p.bd.h.toLocaleString("es-ES"), label: "HORAS", accent: true }].map(({ val, label, accent }) => (
                  <div key={label} style={{ flex: 1, background: accent ? `${p.accentColor}10` : "#f9fafb", border: `1px solid ${accent ? p.accentColor + "30" : "#e5e7eb"}`, borderRadius: 6, padding: "7px 4px", textAlign: "center" }}>
                    <p style={{ fontSize: label === "HORAS" ? 9 : 18, fontWeight: 800, color: label === "HORAS" ? p.accentColor : "#111827", margin: 0, lineHeight: 1 }}>{val}</p>
                    <p style={{ fontSize: 7, fontWeight: 700, color: "#9ca3af", margin: "3px 0 0", letterSpacing: "0.06em" }}>{label}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {p.badges.map((b) => (
                  <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 4, background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 12, padding: "4px 9px" }}>
                    <span style={{ fontSize: 11 }}>{b.icon}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#374151" }}>{b.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: `${p.accentColor}08`, border: `1px solid ${p.accentColor}20`, borderRadius: 8, padding: "8px 10px" }}>
                <p style={{ fontSize: 8, fontWeight: 800, color: p.accentColor, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.08em" }}>⚡ Poder especial</p>
                <p style={{ fontSize: 10, color: "#374151", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>"{p.poder}"</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: "auto" }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e" }} />
                <span style={{ fontSize: 8, color: "#9ca3af", fontWeight: 600 }}>R&A APP · PAREJA VERIFICADA · {p.cardId}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function DataField({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p style={{ fontSize: 7, fontWeight: 700, color: "#9ca3af", margin: "0 0 1px", letterSpacing: "0.08em" }}>{label}</p>
      <p style={{ fontSize: 10, fontWeight: 700, color: color ?? "#111827", margin: 0 }}>{value}</p>
    </div>
  );
}

function mrzLine(name: string, id: string) {
  const n = name.toUpperCase().padEnd(12, "<").slice(0, 12);
  const i = id.replace("-", "").padEnd(10, "<");
  return `${n}<<${i}<<<<<<<<`;
}

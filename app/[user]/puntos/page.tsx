"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore, UserName } from "@/store/userStore";
import {
  getSaldos, getHistorial, getAcciones, aplicarAccion, addAccion, deleteAccion,
  type PuntosAccion, type PuntosHistorial,
} from "@/lib/puntos";

const MAX = 30;
const ORANGE = "#ea580c";

const TIPO_CONFIG = {
  ganar:     { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", label: "GANAR",     icon: "⬆️" },
  perder:    { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "PERDER",    icon: "⬇️" },
  recuperar: { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", label: "RECUPERAR", icon: "🔄" },
};

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" }) + " · " +
    d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

export default function PuntosPage() {
  const params = useParams();
  const router = useRouter();
  const { activeUser, setUser } = useUserStore();
  const user = params.user as UserName;
  useEffect(() => { if (user !== activeUser) setUser(user, user); }, [user]);

  const isAle = user === "alejandro";
  const myName    = isAle ? "Alejandro" : "Rut";
  const otherName = isAle ? "Rut" : "Alejandro";
  const otherUser = isAle ? "rut" : "alejandro";

  const [saldos,   setSaldos]   = useState({ alejandro: 0, rut: 0 });
  const [historial,setHistorial]= useState<PuntosHistorial[]>([]);
  const [acciones, setAcciones] = useState<PuntosAccion[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<"aplicar" | "historial" | "lista">("aplicar");

  // Apply flow
  const [selected,  setSelected]  = useState<PuntosAccion | null>(null);
  const [target,    setTarget]    = useState<string>(user);
  const [applying,  setApplying]  = useState(false);
  const [flash,     setFlash]     = useState<{ msg: string; ok: boolean } | null>(null);

  // New action form
  const [showForm,  setShowForm]  = useState(false);
  const [formText,  setFormText]  = useState("");
  const [formValor, setFormValor] = useState("1");
  const [formTipo,  setFormTipo]  = useState<"ganar" | "perder" | "recuperar">("ganar");
  const [saving,    setSaving]    = useState(false);

  const load = async () => {
    const [s, h, a] = await Promise.all([getSaldos(), getHistorial(), getAcciones()]);
    setSaldos(s); setHistorial(h); setAcciones(a); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const myPuntos    = isAle ? saldos.alejandro : saldos.rut;
  const otherPuntos = isAle ? saldos.rut : saldos.alejandro;

  const handleApply = async () => {
    if (!selected) return;
    // Rules: perder/recuperar → only yourself; ganar → yourself or other
    const finalTarget = selected.tipo !== "ganar" ? user : target;
    setApplying(true);
    await aplicarAccion(finalTarget, user, selected);
    await load();
    const targetName = finalTarget === user ? "ti" : otherName;
    setFlash({ msg: `${selected.valor > 0 ? "+" : ""}${selected.valor} pts a ${targetName} · ${selected.texto}`, ok: selected.valor > 0 });
    setTimeout(() => setFlash(null), 3000);
    setSelected(null);
    setTarget(user);
    setApplying(false);
  };

  const handleAddAccion = async () => {
    if (!formText.trim()) return;
    setSaving(true);
    const val = parseInt(formValor) || 1;
    const finalVal = formTipo === "perder" ? -Math.abs(val) : Math.abs(val);
    await addAccion(formText.trim(), finalVal, formTipo);
    await load();
    setFormText(""); setFormValor("1"); setShowForm(false); setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await deleteAccion(id);
    await load();
  };

  const filteredAcciones = (tipo: string) => acciones.filter((a) => a.tipo === tipo);

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
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0 }}>Puntos R&A ⚡</h1>
            <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>Sistema de pareja</p>
          </div>
        </div>
      </motion.div>

      {/* Flash */}
      <AnimatePresence>
        {flash && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            style={{ margin: "10px 16px 0", padding: "10px 14px", borderRadius: 10, background: flash.ok ? "#f0fdf4" : "#fef2f2", border: `1px solid ${flash.ok ? "#bbf7d0" : "#fecaca"}`, textAlign: "center", flexShrink: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: flash.ok ? "#16a34a" : "#dc2626", margin: 0 }}>{flash.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Score cards */}
      <div style={{ padding: "12px 16px 0", display: "flex", gap: 10, flexShrink: 0 }}>
        {[
          { name: myName,    puntos: myPuntos,    isMe: true  },
          { name: otherName, puntos: otherPuntos, isMe: false },
        ].map(({ name, puntos, isMe }) => {
          const capped   = Math.min(puntos, MAX);
          const bonus    = Math.max(0, puntos - MAX);
          const pct      = (capped / MAX) * 100;
          return (
            <motion.div key={name} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: isMe ? 0.05 : 0.1 }}
              style={{ flex: 1, background: "white", borderRadius: 14, padding: "14px", border: isMe ? `2px solid ${ORANGE}30` : "1px solid #e5e7eb", boxShadow: isMe ? `0 2px 12px ${ORANGE}15` : "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", margin: 0 }}>{name}</p>
                {isMe && <span style={{ fontSize: 9, fontWeight: 800, color: ORANGE, background: `${ORANGE}15`, padding: "2px 7px", borderRadius: 8 }}>TÚ</span>}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: "#111827", lineHeight: 1 }}>{capped}</span>
                <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>/ {MAX}</span>
                {bonus > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 800, color: ORANGE, background: `${ORANGE}15`, padding: "1px 6px", borderRadius: 8, marginLeft: 4 }}>+{bonus} bonus</span>
                )}
              </div>
              {/* Bar */}
              <div style={{ height: 6, background: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ type: "spring", stiffness: 100, damping: 20, delay: isMe ? 0.2 : 0.3 }}
                  style={{ height: "100%", background: `linear-gradient(90deg, ${ORANGE}, #f97316)`, borderRadius: 3 }} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, margin: "12px 16px 0", background: "#f3f4f6", borderRadius: 10, padding: 3, flexShrink: 0 }}>
        {(["aplicar", "historial", "lista"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex: 1, padding: "8px 4px", background: tab === t ? "white" : "transparent", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, color: tab === t ? "#111827" : "#9ca3af", cursor: "pointer", boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none", transition: "all 0.15s" }}>
            {t === "aplicar" ? "⚡ Aplicar" : t === "historial" ? "📋 Historial" : "⚙️ Lista"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", paddingBottom: "calc(24px + env(safe-area-inset-bottom))" }}>

        {/* ── APLICAR ── */}
        {tab === "aplicar" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {(["ganar", "recuperar", "perder"] as const).map((tipo) => {
              const cfg = TIPO_CONFIG[tipo];
              const lista = filteredAcciones(tipo);
              if (lista.length === 0) return null;
              return (
                <div key={tipo}>
                  <p style={{ fontSize: 10, fontWeight: 800, color: cfg.color, margin: "0 0 8px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {cfg.icon} {cfg.label} PUNTOS
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {lista.map((a) => {
                      const isSelected = selected?.id === a.id;
                      return (
                        <div key={a.id}>
                          <motion.button whileTap={{ scale: 0.98 }}
                            onClick={() => { setSelected(isSelected ? null : a); setTarget(user); }}
                            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: isSelected ? cfg.bg : "white", border: `1.5px solid ${isSelected ? cfg.color : "#e5e7eb"}`, borderRadius: 10, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: "#111827", flex: 1 }}>{a.texto}</span>
                            <span style={{ fontSize: 14, fontWeight: 800, color: cfg.color, marginLeft: 10, whiteSpace: "nowrap" }}>
                              {a.valor > 0 ? "+" : ""}{a.valor} pts
                            </span>
                          </motion.button>

                          {/* Expanded: target selector + confirm */}
                          <AnimatePresence>
                            {isSelected && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                style={{ overflow: "hidden" }}>
                                <div style={{ padding: "10px 14px 14px", background: cfg.bg, borderRadius: "0 0 10px 10px", border: `1.5px solid ${cfg.color}`, borderTop: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                                  {/* Target selector (solo para ganar) */}
                                  {tipo === "ganar" && (
                                    <div>
                                      <p style={{ fontSize: 10, fontWeight: 700, color: cfg.color, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>¿Para quién?</p>
                                      <div style={{ display: "flex", gap: 8 }}>
                                        {[{ val: user, label: `Para mí (${myName})` }, { val: otherUser, label: `Para ${otherName}` }].map(({ val, label }) => (
                                          <button key={val} onClick={() => setTarget(val)}
                                            style={{ flex: 1, padding: "8px", background: target === val ? cfg.color : "white", border: `1.5px solid ${cfg.color}`, borderRadius: 8, fontSize: 12, fontWeight: 700, color: target === val ? "white" : cfg.color, cursor: "pointer" }}>
                                            {label}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {tipo !== "ganar" && (
                                    <p style={{ fontSize: 12, color: cfg.color, margin: 0, fontWeight: 600 }}>
                                      {tipo === "perder" ? "Solo puedes quitarte puntos a ti mismo" : "Solo puedes recuperar tus propios puntos"}
                                    </p>
                                  )}
                                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleApply} disabled={applying}
                                    style={{ padding: "11px", background: cfg.color, border: "none", borderRadius: 10, color: "white", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
                                    {applying ? "Aplicando…" : `Confirmar ${a.valor > 0 ? "+" : ""}${a.valor} pts`}
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

        {/* ── HISTORIAL ── */}
        {tab === "historial" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {historial.length === 0 ? (
              <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 14, marginTop: 40 }}>Aún no hay movimientos</p>
            ) : historial.map((h) => {
              const isPos = h.valor > 0;
              const targetLabel = h.user_name === user ? myName : otherName;
              const byLabel     = h.applied_by === user ? "tú" : (isAle ? "Rut" : "Alejandro");
              return (
                <motion.div key={h.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: "white", borderRadius: 10, padding: "12px 14px", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: isPos ? "#f0fdf4" : "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: isPos ? "#16a34a" : "#dc2626" }}>
                      {isPos ? "+" : ""}{h.valor}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>{h.motivo}</p>
                    <p style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0" }}>
                      Para {targetLabel} · por {byLabel} · {fmt(h.created_at)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── LISTA ── */}
        {tab === "lista" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Add new */}
            {!showForm ? (
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowForm(true)}
                style={{ padding: "12px", background: "white", border: `2px dashed ${ORANGE}50`, borderRadius: 12, color: ORANGE, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                + Nueva acción
              </motion.button>
            ) : (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: "white", borderRadius: 12, padding: 16, border: `1px solid ${ORANGE}30` }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: ORANGE, margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Nueva acción</p>
                <input value={formText} onChange={(e) => setFormText(e.target.value)}
                  placeholder="Descripción de la acción…"
                  style={{ width: "100%", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "#111827", outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 10 }} />
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", margin: "0 0 4px", textTransform: "uppercase" }}>Tipo</p>
                    <select value={formTipo} onChange={(e) => setFormTipo(e.target.value as "ganar" | "perder" | "recuperar")}
                      style={{ width: "100%", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "9px 10px", fontSize: 13, color: "#111827", outline: "none", fontFamily: "inherit" }}>
                      <option value="ganar">⬆️ Ganar</option>
                      <option value="perder">⬇️ Perder</option>
                      <option value="recuperar">🔄 Recuperar</option>
                    </select>
                  </div>
                  <div style={{ width: 80 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", margin: "0 0 4px", textTransform: "uppercase" }}>Puntos</p>
                    <input type="number" min="1" max="10" value={formValor} onChange={(e) => setFormValor(e.target.value)}
                      style={{ width: "100%", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "9px 10px", fontSize: 13, color: "#111827", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setShowForm(false)}
                    style={{ flex: 1, padding: 10, background: "#f3f4f6", border: "none", borderRadius: 8, color: "#6b7280", fontSize: 13, cursor: "pointer" }}>
                    Cancelar
                  </button>
                  <button onClick={handleAddAccion} disabled={saving || !formText.trim()}
                    style={{ flex: 2, padding: 10, background: ORANGE, border: "none", borderRadius: 8, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    {saving ? "Guardando…" : "Añadir"}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Existing actions by tipo */}
            {(["ganar", "recuperar", "perder"] as const).map((tipo) => {
              const cfg  = TIPO_CONFIG[tipo];
              const lista = filteredAcciones(tipo);
              if (lista.length === 0) return null;
              return (
                <div key={tipo}>
                  <p style={{ fontSize: 10, fontWeight: 800, color: cfg.color, margin: "0 0 8px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {cfg.icon} {cfg.label}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {lista.map((a) => (
                      <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "white", borderRadius: 10, padding: "11px 14px", border: "1px solid #e5e7eb" }}>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#374151" }}>{a.texto}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: cfg.color, whiteSpace: "nowrap" }}>
                          {a.valor > 0 ? "+" : ""}{a.valor} pts
                        </span>
                        <button onClick={() => handleDelete(a.id)}
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
  );
}

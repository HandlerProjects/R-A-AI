"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore, UserName } from "@/store/userStore";
import {
  getPreferias, createPreferia, getAllRespuestas, savePreferiaRespuesta,
  type Preferia, type PreferiaRespuesta,
} from "@/lib/preferias";
import { awardPoints } from "@/lib/puntos";

const ACCENT  = "#AF52DE";
const ACCENT2 = "#FF2D55";
const BG      = "linear-gradient(135deg, #AF52DE 0%, #FF2D55 100%)";

const other     = (u: string) => u === "alejandro" ? "rut" : "alejandro";
const otherName = (u: string) => u === "alejandro" ? "Rut" : "Alejandro";

export default function PreferiasPage() {
  const params    = useParams();
  const router    = useRouter();
  const { activeUser, setUser } = useUserStore();
  const userParam = params.user as UserName;

  useEffect(() => {
    if (userParam && userParam !== activeUser) setUser(userParam, userParam);
  }, [userParam, activeUser, setUser]);

  const [preferias,   setPreferias]   = useState<Preferia[]>([]);
  const [respuestas,  setRespuestas]  = useState<PreferiaRespuesta[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState<"activa" | "archivadas">("activa");
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  // Form nueva
  const [showForm,  setShowForm]  = useState(false);
  const [formText,  setFormText]  = useState("");
  const [formA,     setFormA]     = useState("");
  const [formB,     setFormB]     = useState("");
  const [saving,    setSaving]    = useState(false);

  const load = async () => {
    const [p, r] = await Promise.all([getPreferias(), getAllRespuestas()]);
    setPreferias(p);
    setRespuestas(r);
    setLoading(false);
    const ids = new Set<string>();
    for (const pref of p) {
      const mine  = r.some((x) => x.preferia_id === pref.id && x.user_name === userParam);
      const theirs = r.some((x) => x.preferia_id === pref.id && x.user_name === other(userParam));
      if (mine && theirs) ids.add(pref.id);
    }
    setRevealedIds(ids);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!formText.trim() || !formA.trim() || !formB.trim()) return;
    setSaving(true);
    const nueva = await createPreferia(formText.trim(), formA.trim(), formB.trim(), userParam);
    if (nueva) {
      fetch("/api/push/preferia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUser: other(userParam), createdBy: userParam, text: formText.trim() }),
      }).catch(() => {});
    }
    setFormText(""); setFormA(""); setFormB("");
    setShowForm(false); setSaving(false);
    await load();
  };

  const handleAnswer = async (preferiaId: string, answer: "a" | "b") => {
    await savePreferiaRespuesta(preferiaId, userParam, answer);
    const updated = await getAllRespuestas();
    setRespuestas(updated);

    const myResp    = updated.find((r) => r.preferia_id === preferiaId && r.user_name === userParam);
    const otherResp = updated.find((r) => r.preferia_id === preferiaId && r.user_name === other(userParam));

    if (myResp && otherResp) {
      const agree = myResp.answer === otherResp.answer;
      if (agree) {
        await awardPoints(userParam,        1,  "🎯 Coincidís · ¿Qué preferirías?");
        await awardPoints(other(userParam), 1,  "🎯 Coincidís · ¿Qué preferirías?");
      } else {
        await awardPoints(userParam,        -1, "💔 No coincidís · ¿Qué preferirías?");
        await awardPoints(other(userParam), -1, "💔 No coincidís · ¿Qué preferirías?");
      }
      setTimeout(() => setRevealedIds((prev) => new Set([...prev, preferiaId])), 400);
    }
  };

  const active   = preferias.filter((p) => {
    const mine   = respuestas.some((r) => r.preferia_id === p.id && r.user_name === userParam);
    const theirs = respuestas.some((r) => r.preferia_id === p.id && r.user_name === other(userParam));
    return !(mine && theirs);
  });
  const archived = preferias.filter((p) => {
    const mine   = respuestas.some((r) => r.preferia_id === p.id && r.user_name === userParam);
    const theirs = respuestas.some((r) => r.preferia_id === p.id && r.user_name === other(userParam));
    return mine && theirs;
  });

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg-primary)", overflow: "hidden" }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        style={{ padding: "14px 20px 0", paddingTop: `calc(14px + env(safe-area-inset-top))`, background: "rgba(242,242,247,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.06)", flexShrink: 0, zIndex: 10 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <button onClick={() => router.back()} style={{ background: "rgba(0,0,0,0.06)", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="#1C1C1E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>¿Qué preferirías? 🤔</h1>
            <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0 }}>Proponed y responded los dos</p>
          </div>
          <motion.button whileTap={{ scale: 0.92 }} onClick={() => setShowForm(true)}
            style={{ width: 36, height: 36, borderRadius: "50%", background: BG, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 3px 12px ${ACCENT}40` }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" /></svg>
          </motion.button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, background: "#f3f4f6", borderRadius: 10, padding: 3, marginBottom: 12 }}>
          {([
            { key: "activa",     label: `🤔 Activa${active.length > 0 ? ` · ${active.length}` : ""}` },
            { key: "archivadas", label: `📋 Archivadas · ${archived.length}` },
          ] as const).map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ flex: 1, padding: "8px 6px", background: tab === key ? "white" : "transparent", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, color: tab === key ? "#111827" : "#9ca3af", cursor: "pointer", boxShadow: tab === key ? "0 1px 3px rgba(0,0,0,0.1)" : "none", transition: "all 0.15s" }}>
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Form nueva */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            style={{ margin: "12px 16px 0", background: "white", borderRadius: 20, padding: "18px", border: `1px solid ${ACCENT}25`, boxShadow: `0 4px 20px ${ACCENT}15`, flexShrink: 0, zIndex: 20 }}
          >
            <p style={{ fontSize: 13, fontWeight: 700, color: ACCENT, margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Nueva pregunta</p>
            <input value={formText} onChange={(e) => setFormText(e.target.value)} placeholder="¿Qué preferirías…?"
              style={{ width: "100%", background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, padding: "10px 12px", fontSize: 14, color: "var(--text-primary)", outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 8 }} />
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#007AFF", margin: "0 0 4px" }}>OPCIÓN A</p>
                <input value={formA} onChange={(e) => setFormA(e.target.value)} placeholder="Primera opción…"
                  style={{ width: "100%", background: "rgba(0,122,255,0.05)", border: "1px solid rgba(0,122,255,0.2)", borderRadius: 10, padding: "9px 10px", fontSize: 13, color: "var(--text-primary)", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT2, margin: "0 0 4px" }}>OPCIÓN B</p>
                <input value={formB} onChange={(e) => setFormB(e.target.value)} placeholder="Segunda opción…"
                  style={{ width: "100%", background: "rgba(255,45,85,0.05)", border: "1px solid rgba(255,45,85,0.2)", borderRadius: 10, padding: "9px 10px", fontSize: 13, color: "var(--text-primary)", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowForm(false)}
                style={{ flex: 1, padding: "10px", background: "rgba(0,0,0,0.06)", border: "none", borderRadius: 12, fontSize: 13, color: "var(--text-secondary)", cursor: "pointer" }}>Cancelar</button>
              <button onClick={handleCreate} disabled={!formText.trim() || !formA.trim() || !formB.trim() || saving}
                style={{ flex: 2, padding: "10px", background: formText.trim() && formA.trim() && formB.trim() ? BG : "rgba(0,0,0,0.06)", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, color: formText.trim() ? "white" : "var(--text-quaternary)", cursor: "pointer" }}>
                {saving ? "Enviando…" : "Publicar 🤔"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: "var(--text-quaternary)", fontSize: 14 }}>Cargando…</p>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px", paddingBottom: `calc(90px + env(safe-area-inset-bottom))` }}>

          {/* ── TAB ACTIVA ── */}
          {tab === "activa" && (
            <>
              {active.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "60px 32px", textAlign: "center" }}>
                  <span style={{ fontSize: 52 }}>✅</span>
                  <p style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>¡Todo respondido!</p>
                  <p style={{ fontSize: 14, color: "var(--text-tertiary)", margin: 0, lineHeight: 1.5 }}>Cread una nueva pregunta con el botón +</p>
                </motion.div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {active.map((p, i) => {
                    const myResp    = respuestas.find((r) => r.preferia_id === p.id && r.user_name === userParam);
                    const otherResp = respuestas.find((r) => r.preferia_id === p.id && r.user_name === other(userParam));
                    const revealed  = revealedIds.has(p.id);
                    const isMine    = p.created_by === userParam;

                    return (
                      <motion.div key={p.id}
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 24, delay: i * 0.04 }}
                        style={{ background: "white", borderRadius: 22, border: "1px solid rgba(0,0,0,0.07)", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
                      >
                        {/* Header */}
                        <div style={{ background: BG, padding: "20px 18px 16px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 12 }}>
                            <p style={{ fontSize: 18, fontWeight: 800, color: "white", margin: 0, lineHeight: 1.4, flex: 1 }}>{p.text}</p>
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", fontWeight: 600, whiteSpace: "nowrap", marginTop: 2 }}>
                              {isMine ? "Tú" : otherName(userParam)}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            {["alejandro", "rut"].map((u) => {
                              const done = respuestas.some((r) => r.preferia_id === p.id && r.user_name === u);
                              return (
                                <div key={u} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, background: done ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)" }}>
                                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: done ? "white" : "rgba(255,255,255,0.4)" }} />
                                  <span style={{ fontSize: 11, fontWeight: 600, color: done ? "white" : "rgba(255,255,255,0.5)" }}>
                                    {u === "alejandro" ? "Alejandro" : "Rut"} {done ? "✓" : "…"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Opciones */}
                        <div style={{ padding: "18px" }}>
                          <AnimatePresence mode="wait">
                            {!myResp ? (
                              <motion.div key="options" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-quaternary)", margin: "0 0 14px", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.07em" }}>¿Qué elegirías?</p>
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                  {[{ opt: p.option_a, ans: "a" as const, color: "#007AFF" }, { opt: p.option_b, ans: "b" as const, color: ACCENT2 }].map(({ opt, ans, color }) => (
                                    <motion.button key={ans} whileTap={{ scale: 0.98 }} onClick={() => handleAnswer(p.id, ans)}
                                      style={{ width: "100%", padding: "16px 14px", background: `${color}08`, border: `1.5px solid ${color}30`, borderRadius: 16, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 14 }}>
                                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <span style={{ fontSize: 14, fontWeight: 800, color: "white" }}>{ans.toUpperCase()}</span>
                                      </div>
                                      <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", margin: 0, lineHeight: 1.4 }}>{opt}</p>
                                    </motion.button>
                                  ))}
                                </div>
                              </motion.div>
                            ) : !revealed ? (
                              <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                  {[{ opt: p.option_a, ans: "a" as const, color: "#007AFF" }, { opt: p.option_b, ans: "b" as const, color: ACCENT2 }].map(({ opt, ans, color }) => (
                                    <div key={ans} style={{ padding: "16px 14px", background: myResp.answer === ans ? `${color}10` : "rgba(0,0,0,0.03)", border: `1.5px solid ${myResp.answer === ans ? color : "rgba(0,0,0,0.06)"}`, borderRadius: 16, display: "flex", alignItems: "center", gap: 14, opacity: myResp.answer === ans ? 1 : 0.4 }}>
                                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: myResp.answer === ans ? color : "rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <span style={{ fontSize: 14, fontWeight: 800, color: myResp.answer === ans ? "white" : "var(--text-quaternary)" }}>{ans.toUpperCase()}</span>
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", margin: 0, lineHeight: 1.4 }}>{opt}</p>
                                        {myResp.answer === ans && <p style={{ fontSize: 11, color, margin: "3px 0 0", fontWeight: 700 }}>Tu elección ✓</p>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                {!otherResp && (
                                  <p style={{ fontSize: 12, color: "var(--text-quaternary)", textAlign: "center", margin: "14px 0 0" }}>
                                    Esperando a {otherName(userParam)}…
                                  </p>
                                )}
                              </motion.div>
                            ) : (
                              <motion.div key="reveal" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 280, damping: 22 }}>
                                <RevealCards optionA={p.option_a} optionB={p.option_b} myAnswer={myResp!.answer} otherAnswer={otherResp!.answer} userParam={userParam} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ── TAB ARCHIVADAS ── */}
          {tab === "archivadas" && (
            <>
              {archived.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "60px 32px", textAlign: "center" }}>
                  <span style={{ fontSize: 52 }}>📭</span>
                  <p style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Nada archivado todavía</p>
                </motion.div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {archived.map((p, i) => {
                    const myResp    = respuestas.find((r) => r.preferia_id === p.id && r.user_name === userParam)!;
                    const otherResp = respuestas.find((r) => r.preferia_id === p.id && r.user_name === other(userParam))!;
                    const agree     = myResp.answer === otherResp.answer;
                    const myChose   = myResp.answer    === "a" ? p.option_a : p.option_b;
                    const otherChose = otherResp.answer === "a" ? p.option_a : p.option_b;
                    const myColor   = myResp.answer    === "a" ? "#007AFF" : ACCENT2;
                    const otherColor = otherResp.answer === "a" ? "#007AFF" : ACCENT2;

                    return (
                      <motion.div key={p.id}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                        style={{ background: "white", borderRadius: 16, border: "1px solid rgba(0,0,0,0.06)", padding: "14px 16px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: 0, lineHeight: 1.4, flex: 1 }}>{p.text}</p>
                          <span style={{ fontSize: 18 }}>{agree ? "🎉" : "🤷"}</span>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <div style={{ flex: 1, background: `${myColor}10`, border: `1px solid ${myColor}30`, borderRadius: 10, padding: "8px 10px" }}>
                            <p style={{ fontSize: 9, fontWeight: 800, color: myColor, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              {userParam === "alejandro" ? "Alejandro" : "Rut"}
                            </p>
                            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", margin: 0, lineHeight: 1.3 }}>{myChose}</p>
                          </div>
                          <div style={{ flex: 1, background: `${otherColor}10`, border: `1px solid ${otherColor}30`, borderRadius: 10, padding: "8px 10px" }}>
                            <p style={{ fontSize: 9, fontWeight: 800, color: otherColor, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              {userParam === "alejandro" ? "Rut" : "Alejandro"}
                            </p>
                            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", margin: 0, lineHeight: 1.3 }}>{otherChose}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <BottomNav userParam={userParam} router={router} />
    </div>
  );
}

function RevealCards({ optionA, optionB, myAnswer, otherAnswer, userParam }: {
  optionA: string; optionB: string;
  myAnswer: "a" | "b"; otherAnswer: "a" | "b";
  userParam: string;
}) {
  const agree   = myAnswer === otherAnswer;
  const myName  = userParam === "alejandro" ? "Alejandro" : "Rut";
  const otherN  = userParam === "alejandro" ? "Rut" : "Alejandro";

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
        {[{ opt: optionA, ans: "a" as const, color: "#007AFF" }, { opt: optionB, ans: "b" as const, color: "#FF2D55" }].map(({ opt, ans, color }) => {
          const myChose    = myAnswer === ans;
          const otherChose = otherAnswer === ans;
          const chosen     = myChose || otherChose;
          return (
            <div key={ans} style={{ padding: "14px", background: chosen ? `${color}10` : "rgba(0,0,0,0.03)", border: `1.5px solid ${chosen ? color : "rgba(0,0,0,0.06)"}`, borderRadius: 16, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: chosen ? color : "rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: chosen ? "white" : "var(--text-quaternary)" }}>{ans.toUpperCase()}</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 5px", lineHeight: 1.4 }}>{opt}</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {myChose    && <span style={{ fontSize: 11, color, fontWeight: 700, background: `${color}15`, padding: "2px 8px", borderRadius: 20 }}>👤 {myName}</span>}
                  {otherChose && <span style={{ fontSize: 11, color, fontWeight: 700, background: `${color}15`, padding: "2px 8px", borderRadius: 20 }}>👤 {otherN}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ textAlign: "center", padding: "10px 16px", background: agree ? "rgba(52,199,89,0.08)" : "rgba(175,82,222,0.08)", borderRadius: 14, border: `1px solid ${agree ? "rgba(52,199,89,0.2)" : `${ACCENT}25`}` }}>
        {agree
          ? <p style={{ fontSize: 14, fontWeight: 700, color: "#34C759", margin: 0 }}>🎉 ¡Los dos elegís lo mismo! +1 pto cada uno</p>
          : <p style={{ fontSize: 14, fontWeight: 700, color: ACCENT, margin: 0 }}>🤷 ¡Cada uno elige diferente! -1 pto cada uno</p>
        }
      </div>
    </div>
  );
}

function BottomNav({ userParam, router }: { userParam: string; router: ReturnType<typeof useRouter> }) {
  return (
    <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(242,242,247,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderTop: "1px solid rgba(0,0,0,0.08)", display: "flex", justifyContent: "space-around", alignItems: "center", paddingBottom: "env(safe-area-inset-bottom)", paddingTop: 8, zIndex: 100 }}>
      {[{ icon: "⊞", label: "Inicio", href: `/${userParam}` }, { icon: "💬", label: "Chat", href: `/${userParam}/chat` }, { icon: "👤", label: "Perfil", href: `/${userParam}/profile` }].map((item) => (
        <button key={item.href} onClick={() => router.push(item.href)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 20px", background: "none", border: "none", cursor: "pointer", opacity: 0.6 }}>
          <span style={{ fontSize: 22 }}>{item.icon}</span>
          <span style={{ fontSize: 10, fontWeight: 500, color: "var(--text-primary)" }}>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

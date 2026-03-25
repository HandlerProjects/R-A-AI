"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore, UserName } from "@/store/userStore";
import { getTodayPregunta, getPreguntaRespuestas, savePreguntaRespuesta, type Pregunta, type PreguntaRespuesta } from "@/lib/preguntas";
import { uploadPhoto } from "@/lib/upload";
import { PhotoPicker, PhotoDisplay } from "@/components/PhotoPicker";

const TIPO_CONFIG = {
  predice:  { color: "#007AFF", bg: "linear-gradient(135deg, #007AFF, #5AC8FA)", emoji: "🔮", label: "¿Qué crees que..." },
  opinion:  { color: "#AF52DE", bg: "linear-gradient(135deg, #AF52DE, #FF2D55)", emoji: "💬", label: "Los dos opinamos" },
  recuerda: { color: "#FF9F0A", bg: "linear-gradient(135deg, #FF9F0A, #FF6B35)", emoji: "📸", label: "Recuerda cuando…" },
};

const other = (u: string) => u === "alejandro" ? "rut" : "alejandro";
const otherName = (u: string) => u === "alejandro" ? "Rut" : "Alejandro";

export default function PreguntaPage() {
  const params = useParams();
  const router = useRouter();
  const { activeUser, setUser } = useUserStore();
  const userParam = params.user as UserName;

  useEffect(() => {
    if (userParam && userParam !== activeUser) setUser(userParam, userParam);
  }, [userParam, activeUser, setUser]);

  const [pregunta, setPregunta] = useState<Pregunta | null>(null);
  const [respuestas, setRespuestas] = useState<PreguntaRespuesta[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [saving, setSaving] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const p = await getTodayPregunta();
      setPregunta(p);
      const resp = await getPreguntaRespuestas(p.id);
      setRespuestas(resp);
      setLoading(false);
    };
    load();
  }, []);

  const myRespuesta = respuestas.find((r) => r.user_name === userParam);
  const otherRespuesta = respuestas.find((r) => r.user_name === other(userParam));
  const bothDone = !!myRespuesta && !!otherRespuesta;

  useEffect(() => {
    if (bothDone) setTimeout(() => setRevealed(true), 500);
  }, [bothDone]);

  const handleSave = async () => {
    if (!inputText.trim() || !pregunta) return;
    setSaving(true);
    let photoUrl: string | null = null;
    if (photoFile) photoUrl = await uploadPhoto(photoFile, "preguntas");
    await savePreguntaRespuesta(pregunta.id, userParam, inputText.trim(), photoUrl);
    const updated = await getPreguntaRespuestas(pregunta.id);
    setRespuestas(updated);
    const otherDone = updated.some((r) => r.user_name === other(userParam));
    fetch("/api/push/pregunta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUser: other(userParam), bothDone: otherDone }),
    }).catch(() => {});
    if (otherDone) setTimeout(() => setRevealed(true), 600);
    setSaving(false);
  };

  const tipo = pregunta ? TIPO_CONFIG[pregunta.tipo] : TIPO_CONFIG.opinion;

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg-primary)", overflow: "hidden" }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        style={{ padding: "14px 20px 12px", paddingTop: `calc(14px + env(safe-area-inset-top))`, background: "rgba(242,242,247,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.06)", flexShrink: 0, zIndex: 10 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.back()} style={{ background: "rgba(0,0,0,0.06)", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="#1C1C1E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Pregunta del día ❓</h1>
            <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0 }}>
              {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: "var(--text-quaternary)", fontSize: 14 }}>Cargando…</p>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 16px", paddingBottom: `calc(90px + env(safe-area-inset-bottom))` }}>

          {/* Pregunta card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: tipo.bg, borderRadius: 22, padding: "24px 20px", marginBottom: 24, boxShadow: `0 8px 30px ${tipo.color}40`, position: "relative", overflow: "hidden" }}
          >
            <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 18 }}>{tipo.emoji}</span>
              <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.75)", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>{tipo.label}</p>
            </div>
            <p style={{ fontSize: 18, fontWeight: 700, color: "white", margin: 0, lineHeight: 1.4 }}>{pregunta?.text}</p>
          </motion.div>

          {/* Status */}
          <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
            {["alejandro", "rut"].map((u) => {
              const done = respuestas.some((r) => r.user_name === u);
              return (
                <div key={u} style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 12, background: done ? "rgba(52,199,89,0.1)" : "rgba(0,0,0,0.04)", border: `1px solid ${done ? "rgba(52,199,89,0.25)" : "rgba(0,0,0,0.06)"}` }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: done ? "#34C759" : "#C7C7CC" }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: done ? "#34C759" : "var(--text-quaternary)" }}>
                    {u === "alejandro" ? "Alejandro" : "Rut"} {done ? "✓" : "…"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* My answer */}
          <AnimatePresence mode="wait">
            {!myRespuesta ? (
              <motion.div key="input" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 10 }}>Tu respuesta</p>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Responde con honestidad…"
                  rows={4}
                  style={{ width: "100%", background: "white", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 16, padding: "14px", fontSize: 14, color: "var(--text-primary)", resize: "none", outline: "none", fontFamily: "inherit", boxSizing: "border-box", lineHeight: 1.5 }}
                />
                <PhotoPicker
                  preview={photoPreview}
                  onSelect={(f, p) => { setPhotoFile(f); setPhotoPreview(p); }}
                  onRemove={() => { setPhotoFile(null); setPhotoPreview(null); }}
                  accentColor={tipo.color}
                />
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={!inputText.trim() || saving}
                  style={{ width: "100%", marginTop: 10, padding: "14px", background: inputText.trim() ? tipo.bg : "rgba(0,0,0,0.07)", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 700, color: inputText.trim() ? "white" : "var(--text-quaternary)", cursor: inputText.trim() ? "pointer" : "default", transition: "all 0.2s" }}
                >
                  {saving ? "Subiendo…" : "Enviar mi respuesta ❓"}
                </motion.button>
              </motion.div>
            ) : (
              <motion.div key="mydone" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 10 }}>Tu respuesta</p>
                <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 16, padding: "14px" }}>
                  <p style={{ fontSize: 14, color: "var(--text-primary)", margin: 0, lineHeight: 1.5 }}>{myRespuesta.content}</p>
                  {myRespuesta.photo_url && <PhotoDisplay url={myRespuesta.photo_url} />}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reveal */}
          <AnimatePresence>
            {revealed && otherRespuesta && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.1 }}
                style={{ marginTop: 20 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <motion.span
                    animate={{ rotateY: [0, 360] }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ fontSize: 20 }}
                  >🃏</motion.span>
                  <p style={{ fontSize: 13, fontWeight: 700, color: tipo.color, margin: 0 }}>
                    Lo que respondió {otherName(userParam)}
                  </p>
                </div>
                <motion.div
                  style={{ background: "white", border: `1px solid ${tipo.color}30`, borderRadius: 16, padding: "16px", boxShadow: `0 4px 20px ${tipo.color}15` }}
                >
                  <p style={{ fontSize: 14, color: "var(--text-primary)", margin: 0, lineHeight: 1.5 }}>{otherRespuesta.content}</p>
                  {otherRespuesta.photo_url && <PhotoDisplay url={otherRespuesta.photo_url} />}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Waiting */}
          {myRespuesta && !otherRespuesta && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              style={{ marginTop: 20, textAlign: "center", padding: "20px", background: "rgba(0,0,0,0.03)", borderRadius: 16 }}
            >
              <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ fontSize: 32, display: "block" }}>🔮</motion.span>
              <p style={{ fontSize: 14, color: "var(--text-tertiary)", margin: "8px 0 0" }}>
                Esperando a {otherName(userParam)}…
              </p>
              <p style={{ fontSize: 12, color: "var(--text-quaternary)", margin: "4px 0 0" }}>
                Te avisamos cuando responda para ver si pensáis igual
              </p>
            </motion.div>
          )}
        </div>
      )}

      <BottomNav userParam={userParam} router={router} />
    </div>
  );
}

function BottomNav({ userParam, router }: { userParam: string; router: any }) {
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

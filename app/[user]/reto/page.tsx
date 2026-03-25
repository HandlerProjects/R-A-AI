"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore, UserName } from "@/store/userStore";
import { getTodayReto, getRespuestas, saveRespuesta, type Reto, type RetoRespuesta } from "@/lib/retos";
import { uploadPhoto } from "@/lib/upload";
import { PhotoPicker, PhotoDisplay } from "@/components/PhotoPicker";

const ACCENT = "#FF6B35";
const other = (u: string) => u === "alejandro" ? "rut" : "alejandro";
const otherName = (u: string) => u === "alejandro" ? "Rut" : "Alejandro";

export default function RetoPage() {
  const params = useParams();
  const router = useRouter();
  const { activeUser, setUser } = useUserStore();
  const userParam = params.user as UserName;

  useEffect(() => {
    if (userParam && userParam !== activeUser) setUser(userParam, userParam);
  }, [userParam, activeUser, setUser]);

  const [reto, setReto] = useState<Reto | null>(null);
  const [respuestas, setRespuestas] = useState<RetoRespuesta[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [saving, setSaving] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const r = await getTodayReto();
      setReto(r);
      const resp = await getRespuestas(r.id);
      setRespuestas(resp);
      setLoading(false);
    };
    load();
  }, []);

  const myRespuesta = respuestas.find((r) => r.user_name === userParam);
  const otherRespuesta = respuestas.find((r) => r.user_name === other(userParam));
  const bothDone = !!myRespuesta && !!otherRespuesta;

  const handleSave = async () => {
    if (!inputText.trim() || !reto) return;
    setSaving(true);
    let photoUrl: string | null = null;
    if (photoFile) photoUrl = await uploadPhoto(photoFile, "retos");
    await saveRespuesta(reto.id, userParam, inputText.trim(), photoUrl);
    const updated = await getRespuestas(reto.id);
    setRespuestas(updated);
    const otherDone = updated.some((r) => r.user_name === other(userParam));
    // Notify other user
    fetch("/api/push/reto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUser: other(userParam), bothDone: otherDone }),
    }).catch(() => {});
    // If both done, also notify me so I know to see reveal
    if (otherDone) {
      setTimeout(() => setShowReveal(true), 600);
    }
    setSaving(false);
  };

  useEffect(() => {
    if (bothDone) setShowReveal(true);
  }, [bothDone]);

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
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Reto del día 🎲</h1>
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

          {/* Reto card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, #FF2D55 100%)`, borderRadius: 22, padding: "24px 20px", marginBottom: 24, boxShadow: "0 8px 30px rgba(255,107,53,0.3)", position: "relative", overflow: "hidden" }}
          >
            <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
            <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 10px" }}>El reto de hoy</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: "white", margin: 0, lineHeight: 1.4 }}>{reto?.text}</p>
          </motion.div>

          {/* Status pills */}
          <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
            {["alejandro", "rut"].map((u) => {
              const done = respuestas.some((r) => r.user_name === u);
              return (
                <div key={u} style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 12, background: done ? "rgba(52,199,89,0.1)" : "rgba(0,0,0,0.04)", border: `1px solid ${done ? "rgba(52,199,89,0.25)" : "rgba(0,0,0,0.06)"}` }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: done ? "#34C759" : "#C7C7CC", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: done ? "#34C759" : "var(--text-quaternary)" }}>
                    {u === "alejandro" ? "Alejandro" : "Rut"} {done ? "✓" : "…"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* My answer area */}
          <AnimatePresence mode="wait">
            {!myRespuesta ? (
              <motion.div key="input" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 10 }}>Tu respuesta</p>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Escribe, describe, comparte lo que sea…"
                  rows={4}
                  style={{ width: "100%", background: "white", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 16, padding: "14px", fontSize: 14, color: "var(--text-primary)", resize: "none", outline: "none", fontFamily: "inherit", boxSizing: "border-box", lineHeight: 1.5 }}
                />
                <PhotoPicker
                  preview={photoPreview}
                  onSelect={(f, p) => { setPhotoFile(f); setPhotoPreview(p); }}
                  onRemove={() => { setPhotoFile(null); setPhotoPreview(null); }}
                  accentColor={ACCENT}
                />
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={!inputText.trim() || saving}
                  style={{ width: "100%", marginTop: 10, padding: "14px", background: inputText.trim() ? `linear-gradient(135deg, ${ACCENT}, #FF2D55)` : "rgba(0,0,0,0.07)", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 700, color: inputText.trim() ? "white" : "var(--text-quaternary)", cursor: inputText.trim() ? "pointer" : "default", transition: "all 0.2s" }}
                >
                  {saving ? "Subiendo…" : "Enviar mi respuesta 🎲"}
                </motion.button>
              </motion.div>
            ) : (
              <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 10 }}>Tu respuesta</p>
                <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 16, padding: "14px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <p style={{ fontSize: 14, color: "var(--text-primary)", margin: 0, lineHeight: 1.5 }}>{myRespuesta.content}</p>
                  {myRespuesta.photo_url && <PhotoDisplay url={myRespuesta.photo_url} />}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reveal */}
          <AnimatePresence>
            {showReveal && otherRespuesta && (
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 280, damping: 24 }}
                style={{ marginTop: 20 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <motion.span animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 0.5, delay: 0.2 }} style={{ fontSize: 20 }}>👀</motion.span>
                  <p style={{ fontSize: 13, fontWeight: 700, color: ACCENT, margin: 0 }}>Respuesta de {otherName(userParam)}</p>
                </div>
                <div style={{ background: `linear-gradient(135deg, #FFF3EE, #FFF8F5)`, border: `1px solid rgba(255,107,53,0.2)`, borderRadius: 16, padding: "16px", boxShadow: "0 4px 16px rgba(255,107,53,0.1)" }}>
                  <p style={{ fontSize: 14, color: "var(--text-primary)", margin: 0, lineHeight: 1.5 }}>{otherRespuesta.content}</p>
                  {otherRespuesta.photo_url && <PhotoDisplay url={otherRespuesta.photo_url} />}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Waiting for other */}
          {myRespuesta && !otherRespuesta && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              style={{ marginTop: 20, textAlign: "center", padding: "20px", background: "rgba(0,0,0,0.03)", borderRadius: 16 }}
            >
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <span style={{ fontSize: 32 }}>⏳</span>
              </motion.div>
              <p style={{ fontSize: 14, color: "var(--text-tertiary)", margin: "8px 0 0" }}>
                Esperando a que {otherName(userParam)} complete el reto…
              </p>
              <p style={{ fontSize: 12, color: "var(--text-quaternary)", margin: "4px 0 0" }}>
                Te avisaremos cuando lo haga
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

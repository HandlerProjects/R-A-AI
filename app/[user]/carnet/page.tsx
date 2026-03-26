"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore, UserName } from "@/store/userStore";
import { getBothProfiles, upsertProfile, type UserProfile } from "@/lib/profiles";
import { uploadPhoto } from "@/lib/upload";

const COUPLE_DATE = "2023-06-15"; // Fecha por defecto — se puede cambiar desde el carnet

function daysTogether(fechaInicio: string | null): number {
  if (!fechaInicio) return 0;
  const start = new Date(fechaInicio);
  const now = new Date();
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
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

  const [profiles, setProfiles] = useState<{ alejandro: UserProfile | null; rut: UserProfile | null }>({
    alejandro: null,
    rut: null,
  });
  const [loading, setLoading] = useState(true);

  // Edit state
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
  const myName = isAlejandro ? "Alejandro" : "Rut";
  const otherName = isAlejandro ? "Rut" : "Alejandro";
  const myStatus = isAlejandro ? "Novio oficial" : "Novia oficial";
  const otherStatus = isAlejandro ? "Novia oficial" : "Novio oficial";
  const myColor = isAlejandro ? "#1C1C1E" : "#FF2D55";
  const otherColor = isAlejandro ? "#FF2D55" : "#1C1C1E";

  // Fecha inicio: usar la del propio perfil, la del otro, o el default
  const fechaInicio = myProfile?.fecha_inicio ?? otherProfile?.fecha_inicio ?? COUPLE_DATE;
  const days = daysTogether(fechaInicio);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    const url = await uploadPhoto(file, `perfiles/${userParam}`);
    if (url) {
      await upsertProfile(userParam, { photo_url: url });
      const updated = await getBothProfiles();
      setProfiles(updated);
    }
    setUploadingPhoto(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    setSaving(true);
    await upsertProfile(userParam, {
      apodo: editApodo.trim() || null,
      fecha_inicio: editFecha || null,
    });
    // Sync fecha_inicio to other profile too (shared date)
    const otherUser = isAlejandro ? "rut" : "alejandro";
    await upsertProfile(otherUser, { fecha_inicio: editFecha || null });
    const updated = await getBothProfiles();
    setProfiles(updated);
    setEditing(false);
    setSaving(false);
  };

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "#0a0a0a", overflow: "hidden" }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: "16px 20px 14px",
          paddingTop: `calc(16px + env(safe-area-inset-top))`,
          display: "flex", alignItems: "center", gap: 12,
          flexShrink: 0,
        }}
      >
        <button onClick={() => router.back()}
          style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "white", margin: 0 }}>Carnets R&A 💕</h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>{days} días juntos</p>
        </div>
        <motion.button whileTap={{ scale: 0.92 }} onClick={() => setEditing(true)}
          style={{ padding: "7px 14px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Editar
        </motion.button>
      </motion.div>

      {/* Scroll content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 20px", paddingBottom: "calc(32px + env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", gap: 20 }}>

        {loading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>Cargando…</p>
          </div>
        ) : (
          <>
            {/* Días juntos banner */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 }}
              style={{
                background: "linear-gradient(135deg, rgba(255,45,85,0.2) 0%, rgba(175,82,222,0.2) 100%)",
                border: "1px solid rgba(255,45,85,0.25)",
                borderRadius: 16,
                padding: "14px 18px",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: 32, fontWeight: 800, color: "white", margin: 0, letterSpacing: "-0.5px" }}>{days.toLocaleString("es-ES")}</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: "2px 0 0" }}>días juntos · desde el {formatDate(fechaInicio)}</p>
            </motion.div>

            {/* Carnet propio */}
            <CarnetCard
              name={myName}
              status={myStatus}
              photoUrl={myProfile?.photo_url ?? null}
              apodo={myProfile?.apodo ?? null}
              accentColor={myColor}
              isMine={true}
              uploading={uploadingPhoto}
              onPhotoClick={() => fileInputRef.current?.click()}
              coupleId="R&A · #001"
              delay={0.1}
            />

            {/* Carnet del otro */}
            <CarnetCard
              name={otherName}
              status={otherStatus}
              photoUrl={otherProfile?.photo_url ?? null}
              apodo={otherProfile?.apodo ?? null}
              accentColor={otherColor}
              isMine={false}
              uploading={false}
              onPhotoClick={() => {}}
              coupleId="R&A · #002"
              delay={0.18}
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handlePhotoUpload}
            />
          </>
        )}
      </div>

      {/* Edit sheet */}
      <AnimatePresence>
        {editing && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditing(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 40 }}
            />
            <motion.div
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              style={{
                position: "fixed", bottom: 0, left: 0, right: 0,
                background: "#1c1c1e", borderRadius: "24px 24px 0 0",
                padding: "24px 20px", paddingBottom: "calc(24px + env(safe-area-inset-bottom))",
                zIndex: 50,
              }}
            >
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)", margin: "0 auto 20px" }} />
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "white", margin: "0 0 20px" }}>Editar mi carnet</h3>

              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Mi apodo (cómo me llama {otherName})
                </p>
                <input
                  value={editApodo}
                  onChange={(e) => setEditApodo(e.target.value)}
                  placeholder={`¿Cómo te llama ${otherName}?`}
                  style={{
                    width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12, padding: "12px 14px", fontSize: 15, color: "white",
                    outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Fecha de inicio
                </p>
                <input
                  type="date"
                  value={editFecha}
                  onChange={(e) => setEditFecha(e.target.value)}
                  style={{
                    width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12, padding: "12px 14px", fontSize: 15, color: "white",
                    outline: "none", fontFamily: "inherit", boxSizing: "border-box", colorScheme: "dark",
                  }}
                />
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

function CarnetCard({
  name, status, photoUrl, apodo, accentColor, isMine, uploading, onPhotoClick, coupleId, delay,
}: {
  name: string; status: string; photoUrl: string | null; apodo: string | null;
  accentColor: string; isMine: boolean; uploading: boolean;
  onPhotoClick: () => void; coupleId: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 24, delay }}
      style={{
        background: "#1c1c1e",
        borderRadius: 24,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)`,
      }}
    >
      {/* Top accent strip */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${accentColor}, ${accentColor}99)` }} />

      <div style={{ padding: "20px" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>

          {/* Photo */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div
              onClick={isMine ? onPhotoClick : undefined}
              style={{
                width: 80, height: 80, borderRadius: 16,
                background: photoUrl ? "transparent" : `${accentColor}22`,
                border: `2px solid ${accentColor}44`,
                overflow: "hidden",
                cursor: isMine ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative",
              }}
            >
              {photoUrl ? (
                <img src={photoUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 32, fontWeight: 700, color: accentColor }}>{name[0]}</span>
              )}
              {isMine && (
                <div style={{
                  position: "absolute", inset: 0,
                  background: uploading ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.2s",
                }}>
                  {uploading && <span style={{ fontSize: 18 }}>⏳</span>}
                </div>
              )}
            </div>
            {isMine && !uploading && (
              <div
                onClick={onPhotoClick}
                style={{
                  position: "absolute", bottom: -4, right: -4,
                  width: 22, height: 22, borderRadius: "50%",
                  background: accentColor, border: "2px solid #1c1c1e",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 6 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "white", margin: 0 }}>{name}</h2>
              {isMine && (
                <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.07)", padding: "3px 7px", borderRadius: 10, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                  TÚ
                </span>
              )}
            </div>

            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: `${accentColor}22`, border: `1px solid ${accentColor}44`, borderRadius: 20, padding: "4px 10px", marginBottom: 12 }}>
              <span style={{ fontSize: 10 }}>❤️</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: accentColor }}>{status}</span>
            </div>

            {apodo && (
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0 0 4px" }}>
                <span style={{ color: "rgba(255,255,255,0.25)" }}>Le llaman </span>
                <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600, fontStyle: "italic" }}>"{apodo}"</span>
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34C759" }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>R&A App · Pareja verificada</span>
          </div>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontWeight: 600, letterSpacing: "0.04em" }}>{coupleId}</span>
        </div>
      </div>
    </motion.div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "ra_push_dismissed";

interface NotificationCardProps {
  userName: string;
}

export function NotificationCard({ userName }: NotificationCardProps) {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    // Only show if not dismissed and push not already granted
    if (localStorage.getItem(STORAGE_KEY)) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission === "granted") return;
    // Small delay so page loads first
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  const handleEnable = async () => {
    setStatus("loading");
    try {
      // Register service worker
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Request permission
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setStatus("error"); return; }

      // Subscribe to push
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });

      // Save to server
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), userName }),
      });

      setStatus("success");
      localStorage.setItem(STORAGE_KEY, "1");
      setTimeout(() => setVisible(false), 2200);
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          style={{
            position: "fixed",
            bottom: `calc(80px + env(safe-area-inset-bottom))`,
            left: 16, right: 16,
            zIndex: 200,
            background: "linear-gradient(135deg, #FF2D55 0%, #FF6B8A 50%, #FF9A5C 100%)",
            borderRadius: 24,
            padding: "20px 20px 18px",
            boxShadow: "0 12px 40px rgba(255,45,85,0.35), 0 4px 16px rgba(0,0,0,0.1)",
            overflow: "hidden",
          }}
        >
          {/* Decorative blobs */}
          <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
          <div style={{ position: "absolute", bottom: -30, left: 10, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />

          {status === "success" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "8px 0" }}
            >
              <motion.span
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.5 }}
                style={{ fontSize: 40 }}
              >
                💗
              </motion.span>
              <p style={{ color: "white", fontWeight: 700, fontSize: 16, margin: 0, textAlign: "center" }}>
                ¡Listo! Te avisaremos el 16 de abril 🇮🇹
              </p>
            </motion.div>
          ) : (
            <>
              {/* Header row */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {/* Animated bell */}
                  <motion.div
                    animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 3 }}
                    style={{
                      width: 46, height: 46, borderRadius: 14,
                      background: "rgba(255,255,255,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 24, flexShrink: 0,
                    }}
                  >
                    🔔
                  </motion.div>
                  <div>
                    <p style={{ color: "white", fontWeight: 700, fontSize: 15, margin: 0, lineHeight: 1.3 }}>
                      Notificación especial
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, margin: "2px 0 0", lineHeight: 1.3 }}>
                      Para el día que os veáis 💗
                    </p>
                  </div>
                </div>
                <button
                  onClick={dismiss}
                  style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* Description */}
              <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, margin: "0 0 16px", lineHeight: 1.55 }}>
                El <strong style={{ color: "white" }}>16 de abril</strong> os mandamos una notificación especial para que no os perdáis ese momento tan especial 🥺🇮🇹
              </p>

              {/* Floating hearts */}
              <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
                {["💗", "🩷", "❤️", "🩷", "💗"].map((h, i) => (
                  <motion.span
                    key={i}
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                    style={{ fontSize: 14 }}
                  >
                    {h}
                  </motion.span>
                ))}
              </div>

              {/* Button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleEnable}
                disabled={status === "loading" || status === "error"}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: 16,
                  border: "none",
                  background: "white",
                  color: "#FF2D55",
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: status === "loading" ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                }}
              >
                {status === "loading" ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                      style={{ width: 16, height: 16, border: "2.5px solid #FF2D5520", borderTopColor: "#FF2D55", borderRadius: "50%" }}
                    />
                    Activando...
                  </>
                ) : status === "error" ? (
                  "No se pudo activar — inténtalo desde la app"
                ) : (
                  <>
                    <span>🔔</span> Activar notificación
                  </>
                )}
              </motion.button>

              {status !== "error" && (
                <button
                  onClick={dismiss}
                  style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: 12, cursor: "pointer", width: "100%", marginTop: 10, padding: "4px 0" }}
                >
                  Ahora no
                </button>
              )}
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

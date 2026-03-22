"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "ra_push_v2";

interface NotificationCardProps {
  userName: string;
}

export function NotificationCard({ userName }: NotificationCardProps) {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission === "granted") return;
    const t = setTimeout(() => setVisible(true), 1800);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "dismissed");
    setVisible(false);
  };

  const handleEnable = async () => {
    setStatus("loading");
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setStatus("idle"); return; }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), userName }),
      });

      setStatus("success");
      localStorage.setItem(STORAGE_KEY, "granted");
      setTimeout(() => setVisible(false), 2000);
    } catch {
      setStatus("idle");
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 340, damping: 28 }}
          style={{
            position: "fixed",
            bottom: `calc(76px + env(safe-area-inset-bottom))`,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 200,
            whiteSpace: "nowrap",
          }}
        >
          {status === "success" ? (
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                background: "linear-gradient(135deg, #FF2D55, #FF7A5C)",
                borderRadius: 30,
                padding: "9px 16px",
                boxShadow: "0 4px 20px rgba(255,45,85,0.3)",
              }}
            >
              {["💗", "🩷", "❤️"].map((h, i) => (
                <motion.span
                  key={i}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
                  style={{ fontSize: 14 }}
                >
                  {h}
                </motion.span>
              ))}
              <span style={{ color: "white", fontWeight: 600, fontSize: 13 }}>
                ¡Activado! Te avisamos cada día 💗
              </span>
            </motion.div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {/* Main pill */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleEnable}
                disabled={status === "loading"}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "rgba(255,255,255,0.92)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,45,85,0.2)",
                  borderRadius: 30,
                  padding: "9px 16px 9px 12px",
                  cursor: "pointer",
                  boxShadow: "0 4px 20px rgba(255,45,85,0.15), 0 1px 6px rgba(0,0,0,0.06)",
                }}
              >
                {status === "loading" ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                    style={{ width: 15, height: 15, border: "2px solid #FF2D5530", borderTopColor: "#FF2D55", borderRadius: "50%" }}
                  />
                ) : (
                  <motion.span
                    animate={{ rotate: [0, -12, 12, -8, 8, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                    style={{ fontSize: 16 }}
                  >
                    🔔
                  </motion.span>
                )}

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#FF2D55", lineHeight: 1.2 }}>
                    Recordatorio diario
                  </span>
                  <span style={{ fontSize: 10, color: "#FF2D55", opacity: 0.6, lineHeight: 1.2 }}>
                    Cuenta atrás hasta el 16 de abril 💗
                  </span>
                </div>

                {/* Subtle hearts */}
                <div style={{ display: "flex", gap: 2, marginLeft: 2 }}>
                  {["💗", "🩷"].map((h, i) => (
                    <motion.span
                      key={i}
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.3 }}
                      style={{ fontSize: 11 }}
                    >
                      {h}
                    </motion.span>
                  ))}
                </div>
              </motion.button>

              {/* Close */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={dismiss}
                style={{
                  width: 30, height: 30,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(0,0,0,0.07)",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="#8E8E93" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </motion.button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr.buffer as ArrayBuffer;
}

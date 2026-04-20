"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUserStore } from "@/store/userStore";
import { motion, AnimatePresence } from "framer-motion";
import { getUserId } from "@/lib/memory";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const { activeUser, userId, setUser } = useUserStore();
  const urlUser = params.user as string;

  // Carga el UUID real de Supabase si aún no lo tenemos
  useEffect(() => {
    if (!urlUser) return;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}/.test(userId ?? "");
    if (isUUID) return;
    getUserId(urlUser as "alejandro" | "rut").then((id) => {
      if (id) setUser(urlUser as "alejandro" | "rut", id);
    });
  }, [urlUser]);

  // Renueva la suscripción push en cada apertura de la app (silencioso)
  useEffect(() => {
    if (!urlUser || typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission !== "granted") return;

    (async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        // Obtener suscripción actual o crear una nueva
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
          });
        }
        // Upsert silencioso en Supabase
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: sub.toJSON(), userName: urlUser }),
        });
      } catch {
        // Silencioso — no interrumpir la experiencia si falla
      }
    })();
  }, [urlUser]);

  // Solo muestra el banner cuando estás viendo el perfil del otro
  const isViewingOther = activeUser && urlUser && activeUser !== urlUser;
  const otherName = urlUser === "rut" ? "Rut" : "Alejandro";
  const backUser = activeUser as string;

  return (
    <>
      {children}

      <AnimatePresence>
        {isViewingOther && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            style={{
              position: "fixed",
              bottom: `calc(80px + env(safe-area-inset-bottom))`,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 200,
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(175,82,222,0.92)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderRadius: 30,
              padding: "8px 14px 8px 10px",
              boxShadow: "0 4px 20px rgba(175,82,222,0.35)",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontSize: 14 }}>👁</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "white" }}>
              Perfil de {otherName}
            </span>
            <button
              onClick={() => router.push(`/${backUser}`)}
              style={{
                marginLeft: 4,
                background: "rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: 20,
                padding: "3px 10px",
                fontSize: 11,
                fontWeight: 700,
                color: "white",
                cursor: "pointer",
              }}
            >
              Volver al mío
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

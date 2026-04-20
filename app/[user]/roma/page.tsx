"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore, UserName } from "@/store/userStore";

const DEPARTURE = new Date("2026-04-24T05:20:00");

type Day = "jueves" | "viernes";

const ITINERARY: Record<Day, {
  time: string;
  icon: string;
  title: string;
  subtitle?: string;
  detail?: string;
  tag?: string;
  tagColor?: string;
  tipo: "transport" | "food" | "culture" | "shop" | "free";
}[]> = {
  jueves: [
    {
      time: "05:20",
      icon: "🚌",
      title: "Bus a Roma",
      subtitle: "Palencia → Roma Tiburtina",
      detail: "Avant · Salida puntual. Llegada estimada 08:05 h.",
      tag: "Transporte",
      tagColor: "#5E5CE6",
      tipo: "transport",
    },
    {
      time: "08:05",
      icon: "🏙️",
      title: "Llegada a Roma Tiburtina",
      subtitle: "Estación de autobuses de Roma",
      detail: "Metro B desde Tiburtina → Colosseo (15 min). O pasear por San Lorenzo hasta el centro.",
      tag: "Llegada",
      tagColor: "#34C759",
      tipo: "transport",
    },
    {
      time: "08:15",
      icon: "☕",
      title: "Desayuno — Sant'Eustachio il Caffè",
      subtitle: "Piazza di Sant'Eustachio 82 · junto al Panthéon",
      detail: "El café más famoso de Roma, a 2 min andando del hotel Ele Suites Pantheon. Cappuccino con su mezcla secreta de robusta. Pedir también un maritozzo con panna o cornetto al pistacchio. Abre desde las 7:30h.",
      tag: "Desayuno",
      tagColor: "#FF9F0A",
      tipo: "food",
    },
    {
      time: "08:30",
      icon: "🏨",
      title: "Check-in · Ele Suites Pantheon",
      subtitle: "Centro Storico · junto al Panthéon",
      detail: "Dejar equipaje (check-in oficial suele ser a las 14h pero puede guardarse el equipaje). Hotel boutique en ubicación privilegiada. A 11 min a pie de Campo de' Fiori, 5 min del Panthéon.",
      tipo: "free",
    },
    {
      time: "10:00",
      icon: "👨‍👩‍👧‍👦",
      title: "Llega la familia",
      subtitle: "Reunión en el alojamiento",
      detail: "Tiempo para organizaros y planificar el día juntos.",
      tipo: "free",
    },
    {
      time: "13:00",
      icon: "🍝",
      title: "Comida — Trattoria Luzzi",
      subtitle: "Via S. Giovanni in Laterano 88 · cerca del Coliseo",
      detail: "Trattoria clásica romana desde 1945. Pedir: Carbonara auténtica, Cacio e pepe, Abbacchio al forno. Sin reserva, ir pronto.",
      tag: "Comida",
      tagColor: "#FF6B35",
      tipo: "food",
    },
    {
      time: "15:30",
      icon: "🛍️",
      title: "Tiendas en Monti",
      subtitle: "Via del Boschetto · Via Panisperna",
      detail: "El barrio más cool de Roma para moda. Tiendas: Pifebo Vintage Store (Via degli Zingari 4), Pulp (Via del Boschetto 140), Le Gallinelle (Via del Boschetto 76). Ropa única, piezas de diseñador italiano indie.",
      tag: "Shopping",
      tagColor: "#AF52DE",
      tipo: "shop",
    },
    {
      time: "16:45",
      icon: "🏛️",
      title: "Coliseo · ENTRADA RESERVADA",
      subtitle: "Piazza del Colosseo 1",
      detail: "Entrada ya comprada. Llevar confirmación y DNI. Incluye Foro Romano y Palatino. Duración aprox. 2h. Vistas increíbles al atardecer.",
      tag: "Cultura · Reservado ✓",
      tagColor: "#FF2D55",
      tipo: "culture",
    },
    {
      time: "19:30",
      icon: "🌆",
      title: "Paseo por el Foro Romano",
      subtitle: "Con entrada del Coliseo",
      detail: "El Arco de Constantino, la Via Sacra, el Arco de Tito. Mejor al atardecer.",
      tipo: "free",
    },
    {
      time: "21:00",
      icon: "🍕",
      title: "Cena — Da Remo",
      subtitle: "Piazza S. Maria Liberatrice 44 · Testaccio",
      detail: "La mejor pizza romana en ciudad. Masa finísima y crujiente. Pedir: Margherita, Carciofi e prosciutto. Cola habitual pero rápida. Barrio obrero auténtico.",
      tag: "Cena",
      tagColor: "#FF3B30",
      tipo: "food",
    },
  ],
  viernes: [
    {
      time: "08:30",
      icon: "☕",
      title: "Desayuno en Prati",
      subtitle: "Barrio junto al Vaticano",
      detail: "Bar Il Sorpasso (Via Properzio 31/33) — desayuno espectacular, muy local. O Castroni (Via Cola di Rienzo) para pasteles típicos romanos. Maritozzo con panna imprescindible.",
      tag: "Desayuno",
      tagColor: "#FF9F0A",
      tipo: "food",
    },
    {
      time: "Hora por confirmar",
      icon: "⛪",
      title: "Vaticano · ENTRADA RESERVADA",
      subtitle: "Viale Vaticano · Museos + Capilla Sixtina",
      detail: "Entrada ya comprada. Llevar confirmación y DNI. Reservar al menos 3-4h. Capilla Sixtina → Basílica San Pedro → Cúpula (opcional, subida a pie).",
      tag: "Cultura · Reservado ✓",
      tagColor: "#FF2D55",
      tipo: "culture",
    },
    {
      time: "13:30",
      icon: "🍕",
      title: "Almuerzo — Pizzarium (Bonci)",
      subtitle: "Via della Meloria 43 · Prati",
      detail: "El mejor pizza al taglio del mundo según muchos críticos. Gabriele Bonci. Pedir por peso, pagan por gramos. Imprescindible: patata y romero, fiori di zucca, mortadella e burrata.",
      tag: "Comida",
      tagColor: "#FF6B35",
      tipo: "food",
    },
    {
      time: "15:00",
      icon: "🛍️",
      title: "Shopping vintage — Via del Governo Vecchio",
      subtitle: "Entre Piazza Navona y Campo de' Fiori",
      detail: "La calle más vintage de Roma. Tiendas: Vestiti Usati Cinzia (nº 45), Mado (nº 89), Omero & Cecilia (nº 110). También: Trastevere — Signorvintage (Via S. Francesco a Ripa 29). Precios razonables, piezas únicas.",
      tag: "Shopping",
      tagColor: "#AF52DE",
      tipo: "shop",
    },
    {
      time: "17:00",
      icon: "🏛️",
      title: "Piazza Navona & Panthéon",
      subtitle: "Centro histórico",
      detail: "Piazza Navona gratis — Fontana dei Quattro Fiumi de Bernini. Panthéon (reserva online si queréis entrar). Heladería en Piazza della Rotonda.",
      tipo: "free",
    },
    {
      time: "18:30",
      icon: "🍦",
      title: "Gelato — Fatamorgana",
      subtitle: "Via Roma Libera 11 · Trastevere",
      detail: "Gelatería artesanal sin gluten y sin lactosa (pero buenísima para todos). Sabores únicos: Basilico&Pistacchio, Cioccolato fondente&sale, Rosa&lampone. La mejor de Roma.",
      tag: "Imprescindible",
      tagColor: "#FF2D55",
      tipo: "food",
    },
    {
      time: "20:30",
      icon: "🍷",
      title: "Cena de despedida — Tonnarello",
      subtitle: "Via della Paglia 1 · Trastevere",
      detail: "Clásico de Trastevere. Terraza exterior (reservar). Pedir: Cacio e pepe, Amatriciana, Saltimbocca alla romana. Vino de la casa impecable.",
      tag: "Cena",
      tagColor: "#FF3B30",
      tipo: "food",
    },
  ],
};

function useCountdown() {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, done: false });
  useEffect(() => {
    const tick = () => {
      const diff = DEPARTURE.getTime() - Date.now();
      if (diff <= 0) { setTime({ days: 0, hours: 0, minutes: 0, done: true }); return; }
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        done: false,
      });
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);
  return time;
}

const TYPE_COLORS: Record<string, string> = {
  transport: "#5E5CE6",
  food: "#FF6B35",
  culture: "#FF2D55",
  shop: "#AF52DE",
  free: "#34C759",
};

export default function RomaPage() {
  const params = useParams();
  const router = useRouter();
  const { activeUser, setUser } = useUserStore();
  const userParam = params.user as UserName;
  const isAlejandro = userParam === "alejandro";

  useEffect(() => {
    if (userParam && userParam !== activeUser) setUser(userParam, userParam);
  }, [userParam, activeUser, setUser]);

  const countdown = useCountdown();
  const [activeDay, setActiveDay] = useState<Day>("jueves");
  const [expanded, setExpanded] = useState<number | null>(null);

  const events = ITINERARY[activeDay];

  return (
    <div style={{ minHeight: "100dvh", background: "#0a0a0f", color: "white", fontFamily: "-apple-system, 'SF Pro Display', sans-serif" }}>

      {/* Hero */}
      <div style={{ position: "relative", overflow: "hidden", paddingTop: `calc(52px + env(safe-area-inset-top))`, paddingBottom: 32, background: "linear-gradient(160deg, #0a0a0f 0%, #1a0a1f 40%, #0f1a0a 100%)" }}>
        {/* Back button */}
        <button onClick={() => router.back()} style={{ position: "absolute", top: `calc(16px + env(safe-area-inset-top))`, left: 16, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 5l-7 7 7 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>

        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -60, right: -40, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,122,255,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -40, left: -40, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,45,85,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ padding: "0 20px", textAlign: "center" }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div style={{ fontSize: 56, marginBottom: 8, lineHeight: 1 }}>🇮🇹</div>
            <h1 style={{ fontSize: 34, fontWeight: 800, margin: "0 0 4px", letterSpacing: "-0.5px", background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Roma
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: "0 0 24px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Alejandro & Rut · 24–25 Abril 2026
            </p>
          </motion.div>

          {/* Countdown */}
          {!countdown.done ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
              style={{ display: "inline-flex", gap: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "14px 20px" }}>
              {[
                { value: countdown.days, label: "días" },
                { value: countdown.hours, label: "horas" },
                { value: countdown.minutes, label: "min" },
              ].map(({ value, label }, i) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: i < 2 ? 10 : 0 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "white", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                      {String(value).padStart(2, "0")}
                    </div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>{label}</div>
                  </div>
                  {i < 2 && <div style={{ fontSize: 20, color: "rgba(255,255,255,0.2)", marginBottom: 8 }}>:</div>}
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: 18, fontWeight: 700, color: "#34C759" }}>
              ¡Estáis en Roma! 🎉
            </motion.div>
          )}
        </div>
      </div>

      {/* Info pills */}
      <div style={{ padding: "0 16px 16px", display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {[
          { icon: "🚌", text: "Bus 05:20 → 08:05" },
          { icon: "🏛️", text: "Coliseo 16:45 Jue" },
          { icon: "⛪", text: "Vaticano Vie" },
        ].map((p) => (
          <div key={p.text} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "5px 12px", fontSize: 11, color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>
            {p.icon} {p.text}
          </div>
        ))}
      </div>

      {/* Day tabs */}
      <div style={{ padding: "0 16px 16px", display: "flex", gap: 8 }}>
        {(["jueves", "viernes"] as Day[]).map((day) => (
          <motion.button key={day} whileTap={{ scale: 0.95 }} onClick={() => { setActiveDay(day); setExpanded(null); }}
            style={{ flex: 1, padding: "11px", borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "inherit", transition: "all 0.2s",
              background: activeDay === day ? "white" : "rgba(255,255,255,0.07)",
              color: activeDay === day ? "#0a0a0f" : "rgba(255,255,255,0.45)",
            }}>
            {day === "jueves" ? "Jue 24 Abr" : "Vie 25 Abr"}
          </motion.button>
        ))}
      </div>

      {/* Timeline */}
      <div style={{ padding: "0 16px 32px" }}>
        <AnimatePresence mode="wait">
          <motion.div key={activeDay} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}
            style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {events.map((ev, i) => {
              const isExpanded = expanded === i;
              const lineColor = TYPE_COLORS[ev.tipo];
              return (
                <div key={i} style={{ display: "flex", gap: 12, position: "relative" }}>
                  {/* Timeline line */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 32, flexShrink: 0 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${lineColor}20`, border: `2px solid ${lineColor}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, zIndex: 1 }}>
                      {ev.icon}
                    </div>
                    {i < events.length - 1 && (
                      <div style={{ width: 2, flex: 1, minHeight: 20, background: "rgba(255,255,255,0.07)", margin: "4px 0" }} />
                    )}
                  </div>

                  {/* Card */}
                  <motion.div
                    layout
                    onClick={() => setExpanded(isExpanded ? null : i)}
                    style={{ flex: 1, marginBottom: 12, background: "rgba(255,255,255,0.04)", border: `1px solid ${isExpanded ? lineColor + "40" : "rgba(255,255,255,0.07)"}`, borderRadius: 16, padding: "12px 14px", cursor: "pointer", transition: "border-color 0.2s" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: lineColor, fontVariantNumeric: "tabular-nums" }}>{ev.time}</span>
                          {ev.tag && (
                            <span style={{ fontSize: 9, fontWeight: 700, color: ev.tagColor ?? lineColor, background: `${ev.tagColor ?? lineColor}18`, padding: "2px 7px", borderRadius: 20, letterSpacing: "0.04em" }}>
                              {ev.tag}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 15, fontWeight: 700, color: "white", margin: "0 0 2px" }}>{ev.title}</p>
                        {ev.subtitle && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>{ev.subtitle}</p>}
                      </div>
                      <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ marginTop: 4, flexShrink: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </motion.div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && ev.detail && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", margin: "10px 0 0", lineHeight: 1.6, overflow: "hidden" }}
                        >
                          {ev.detail}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

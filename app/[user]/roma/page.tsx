"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore, UserName } from "@/store/userStore";

/* ─── Fecha de salida ─────────────────────────────────────────── */
const DEPARTURE = new Date("2026-04-24T05:20:00");

/* ─── Tipos ───────────────────────────────────────────────────── */
type ItineraryDay = "jueves" | "viernes";
type Day = ItineraryDay | "guia";
type EventType = "transport" | "food" | "culture" | "shop" | "hotel" | "free";

interface RomaEvent {
  time: string;
  icon: string;
  title: string;
  subtitle: string;
  detail: string;
  photo?: string;
  tag?: string;
  tipo: EventType;
  maps?: string;
  web?: string;
  walk?: string; // indicación de desplazamiento desde el anterior
}

/* ─── Colores por tipo ────────────────────────────────────────── */
const TYPE: Record<EventType, { color: string; bg: string; label: string }> = {
  transport: { color: "#5E5CE6", bg: "#5E5CE610", label: "Transporte" },
  food:      { color: "#FF9F0A", bg: "#FF9F0A10", label: "Comida" },
  culture:   { color: "#FF2D55", bg: "#FF2D5510", label: "Cultura" },
  shop:      { color: "#AF52DE", bg: "#AF52DE10", label: "Shopping" },
  hotel:     { color: "#34C759", bg: "#34C75910", label: "Alojamiento" },
  free:      { color: "#64D2FF", bg: "#64D2FF10", label: "Libre" },
};

/* ─── Fotos (Unsplash CDN confiables) ────────────────────────── */
const P = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=600&q=80&auto=format&fit=crop`;

const PHOTOS = {
  hero:        P("1552832230-c0197dd311b5"),   // Coliseo aéreo
  coffee:      P("1509042239860-f550ce710b93"), // Cappuccino
  pantheon:    P("1515542622106-078bda9a1b47"), // Panthéon
  navona:      P("1515542622106-078bda9a1b47"), // Piazza Navona (fallback pantheon)
  pasta:       P("1548940392-b4d1eef2df11"),    // Pasta carbonara
  monti:       P("1523906834658-6e24ef2386f9"), // Calle romana / Monti
  vintage:     P("1441986300917-64674bd600d8"), // Ropa vintage
  colosseum:   P("1552832230-c0197dd311b5"),    // Coliseo
  forum:       P("1548580996-b8cec0a8f4f0"),    // Foro romano
  pizza:       P("1513104890138-7c749659a591"), // Pizza
  testaccio:   P("1555396273-367ea4eb4db5"),    // Comida romana
  vatican:     P("1531572753322-ad063cecc140"), // Vaticano
  pizzarium:   P("1513104890138-7c749659a591"), // Pizza al taglio
  govvecchio:  P("1523906834658-6e24ef2386f9"), // Calle Roma vintage
  navona2:     P("1529261929032-0f40782c5f9b"), // Piazza Navona 2
  gelato:      P("1567206563064-6f60f40a2b57"), // Gelato
  trastevere:  P("1555992336-03a23c7b20ee"),    // Trastevere
};

/* ─── Itinerario ──────────────────────────────────────────────── */
const ITINERARY: Record<ItineraryDay, RomaEvent[]> = {
  jueves: [
    {
      time: "05:20",
      icon: "🚌",
      title: "Bus a Roma",
      subtitle: "Palencia → Roma Tiburtina",
      detail: "Salida puntual. Bus directo, llegada estimada 08:05 h a la estación Tiburtina. Llevar snacks y auriculares.",
      tipo: "transport",
      tag: "3h 45min de viaje",
    },
    {
      time: "08:05",
      icon: "🏙️",
      title: "Llegada · Estación Tiburtina",
      subtitle: "Via Tiburtina · Roma NE",
      detail: "Tomar Metro B desde Tiburtina → Termini (2 paradas), luego bus 40/64 hacia el centro o taxi. En ~35 min llegáis al hotel. También disponible autobús nocturno.",
      tipo: "transport",
      maps: "https://www.google.com/maps/search/?api=1&query=Stazione+Tiburtina+Roma",
      walk: "35 min en metro + bus al hotel",
      photo: PHOTOS.colosseum,
    },
    {
      time: "08:45",
      icon: "☕",
      title: "Desayuno · Sant'Eustachio il Caffè",
      subtitle: "Piazza di Sant'Eustachio 82 · 2 min del hotel a pie",
      detail: "El café más mítico de Roma. Llevan desde 1938. Su cappuccino es una experiencia: mezcla secreta de robusta que no encontraréis en otro sitio. Pedir también un cornetto al pistacchio o maritozzo con panna. Colas rápidas.",
      photo: PHOTOS.coffee,
      tipo: "food",
      tag: "Histórico desde 1938",
      maps: "https://www.google.com/maps/search/?api=1&query=Sant'Eustachio+il+Caffè+Roma",
      web: "https://www.santeustachioilcaffe.it",
      walk: "2 min a pie desde el hotel",
    },
    {
      time: "09:15",
      icon: "🏨",
      title: "Check-in · Ele Suites Pantheon",
      subtitle: "Centro Storico · junto al Panthéon",
      detail: "Boutique hotel en la mejor ubicación de Roma. Check-in oficial a las 14h, pero podéis dejar el equipaje. El hotel está a 2 min andando del Panthéon, 5 min de Piazza Navona y 8 min de Campo de' Fiori.",
      photo: PHOTOS.pantheon,
      tipo: "hotel",
      maps: "https://www.google.com/maps/search/?api=1&query=Ele+Suites+Pantheon+Roma",
      web: "https://www.elesuitespantheon.com",
    },
    {
      time: "10:00",
      icon: "👨‍👩‍👧‍👦",
      title: "Llega la familia · Reunión",
      subtitle: "En el hotel o Piazza della Rotonda",
      detail: "Punto de encuentro en la plaza del Panthéon. Organizáis el día juntos con un café en la terraza de cualquier bar de la plaza.",
      tipo: "free",
      maps: "https://www.google.com/maps/search/?api=1&query=Piazza+della+Rotonda+Roma",
    },
    {
      time: "10:30",
      icon: "🏛️",
      title: "Panthéon + Piazza Navona",
      subtitle: "2 – 5 min del hotel · centro histórico",
      detail: "El Panthéon (entrada gratuita con reserva online, 5€) es uno de los edificios más perfectos del mundo. 2000 años de historia. Luego a Piazza Navona (5 min andando) para ver la Fontana dei Quattro Fiumi de Bernini. Parada obligada.",
      photo: PHOTOS.pantheon,
      tipo: "culture",
      tag: "Gratis · reservar online",
      maps: "https://www.google.com/maps/search/?api=1&query=Pantheon+Roma",
      web: "https://www.pantheonroma.com",
      walk: "2 min del hotel",
    },
    {
      time: "12:30",
      icon: "🍝",
      title: "Almuerzo · Osteria dell'Ingegno",
      subtitle: "Piazza di Pietra 45 · 5 min del hotel",
      detail: "Cocina romana tradicional con vistas a un templo romano. Pedir: Tonnarelli cacio e pepe, Baccalà fritto, Abbacchio al forno. Carta de vinos excelente. Ambiente local, sin turistas masivos.",
      photo: PHOTOS.pasta,
      tipo: "food",
      maps: "https://www.google.com/maps/search/?api=1&query=Osteria+dell'Ingegno+Roma+Piazza+di+Pietra",
      walk: "5 min del hotel",
    },
    {
      time: "14:00",
      icon: "🛍️",
      title: "Shopping · Barrio Monti",
      subtitle: "Via del Boschetto + Via degli Zingari · 20 min del hotel",
      detail: "El barrio más trendy y auténtico de Roma. Pequeñas boutiques, vintage y moda italiana indie. No encontraréis nada de esto en Zara. Imprescindible perderse por sus callejones.",
      photo: PHOTOS.monti,
      tipo: "shop",
      maps: "https://www.google.com/maps/search/?api=1&query=Rione+Monti+Roma",
      walk: "20 min a pie o 10 min en bus desde el hotel",
    },
    {
      time: "14:15",
      icon: "👗",
      title: "Pifebo Vintage Store",
      subtitle: "Via degli Zingari 4 · Monti",
      detail: "La tienda vintage más conocida de Monti. Ropa de los 70s, 80s y 90s seleccionada a mano. Precios razonables, piezas únicas. Perfecta para encontrar algo que no tenga nadie más.",
      photo: PHOTOS.vintage,
      tipo: "shop",
      maps: "https://www.google.com/maps/search/?api=1&query=Pifebo+Vintage+Store+Via+degli+Zingari+Roma",
      web: "https://pifebo.com",
    },
    {
      time: "14:45",
      icon: "🧥",
      title: "Pulp · Via del Boschetto 140",
      subtitle: "Via del Boschetto 140 · Monti",
      detail: "Selección curada de vintage y diseñadores independientes italianos. Blusas, chaquetas de cuero, zapatillas de edición limitada. El local favorito de los romanos que saben de moda.",
      photo: PHOTOS.vintage,
      tipo: "shop",
      maps: "https://www.google.com/maps/search/?api=1&query=Pulp+Via+del+Boschetto+Roma",
    },
    {
      time: "16:00",
      icon: "🚶",
      title: "A pie hasta el Coliseo",
      subtitle: "5 min andando desde Monti",
      detail: "Monti está literalmente al lado del Coliseo. Caminad por Via Sacra pasando por los Foros Imperiales. El camino ya es espectacular.",
      tipo: "transport",
      walk: "5 min a pie desde las tiendas",
    },
    {
      time: "16:45",
      icon: "🏟️",
      title: "COLISEO · Entrada reservada ✓",
      subtitle: "Piazza del Colosseo 1 · Colosseo",
      detail: "Llevar confirmación de reserva y DNI. La entrada incluye Foro Romano y Palatino. Duración recomendada: 2h en el Coliseo + 1h en el Foro. Las vistas desde el tercer nivel al atardecer son impresionantes. Prohibido entrar con mochilas grandes.",
      photo: PHOTOS.colosseum,
      tipo: "culture",
      tag: "Reservado ✓ · 16:45",
      maps: "https://www.google.com/maps/search/?api=1&query=Colosseo+Roma",
      web: "https://www.coopculture.it",
    },
    {
      time: "19:00",
      icon: "🌅",
      title: "Foro Romano al atardecer",
      subtitle: "Incluido con la entrada del Coliseo",
      detail: "Con la misma entrada podéis recorrer el Foro Romano y el Palatino. El atardecer sobre las ruinas es uno de los momentos más bonitos de Roma. Walked el Arco de Tito y la Via Sacra.",
      photo: PHOTOS.forum,
      tipo: "culture",
      maps: "https://www.google.com/maps/search/?api=1&query=Foro+Romano+Roma",
    },
    {
      time: "20:30",
      icon: "🍕",
      title: "Cena · Da Remo · Testaccio",
      subtitle: "Piazza S. Maria Liberatrice 44 · 20 min del Coliseo",
      detail: "La pizza romana más auténtica de la ciudad. Masa finísima y crujiente, diferente a la napolitana. Local de toda la vida, sin turistas (o casi). Pedir: Margherita, Carciofi e prosciutto, Diavola. Sin reserva, suele haber cola pero es rápida.",
      photo: PHOTOS.pizza,
      tipo: "food",
      tag: "Icónico · sin reserva",
      maps: "https://www.google.com/maps/search/?api=1&query=Da+Remo+Testaccio+Roma",
      walk: "20 min a pie o 10 min en bus desde el Coliseo",
    },
  ],
  viernes: [
    {
      time: "08:30",
      icon: "☕",
      title: "Desayuno · Castroni · Prati",
      subtitle: "Via Cola di Rienzo 196 · Prati",
      detail: "Delicatessen y pastelería histórica de Roma. La mejor selección de productos italianos: pastas, conservas, vinos, y bollería fresca. Perfecto para un desayuno antes del Vaticano que está a 10 min andando.",
      photo: PHOTOS.coffee,
      tipo: "food",
      maps: "https://www.google.com/maps/search/?api=1&query=Castroni+Via+Cola+di+Rienzo+Roma",
      web: "https://www.castroni.it",
      walk: "Prati, barrio junto al Vaticano",
    },
    {
      time: "10:00",
      icon: "⛪",
      title: "VATICANO · Entrada reservada ✓",
      subtitle: "Viale Vaticano · Ciudad del Vaticano",
      detail: "Llevar confirmación y DNI. El recorrido recomendado: Museos Vaticanos → Capilla Sixtina (el techo de Miguel Ángel, 4 años de trabajo) → Basílica de San Pedro → opcional subir a la Cúpula (551 escalones, vistas 360° de Roma). Reservad mínimo 3–4h. Código de vestimenta obligatorio: sin hombros ni rodillas descubiertas.",
      photo: PHOTOS.vatican,
      tipo: "culture",
      tag: "Reservado ✓",
      maps: "https://www.google.com/maps/search/?api=1&query=Musei+Vaticani+Roma",
      web: "https://www.museivaticani.va",
      walk: "10 min a pie desde el desayuno",
    },
    {
      time: "13:30",
      icon: "🍕",
      title: "Almuerzo · Pizzarium (Bonci)",
      subtitle: "Via della Meloria 43 · Prati · 10 min del Vaticano",
      detail: "El pizza al taglio más famoso del mundo según críticos internacionales. Gabriele Bonci revolucionó la pizza con fermentación larga y masa madre. Se paga por peso. Imprescindible pedir: patata e rosmarino, fiori di zucca e alici, mortadella e burrata. Sin asientos, se come de pie o en la calle.",
      photo: PHOTOS.pizzarium,
      tipo: "food",
      tag: "Mejor pizza al taglio del mundo",
      maps: "https://www.google.com/maps/search/?api=1&query=Pizzarium+Bonci+Via+della+Meloria+Roma",
      web: "https://www.bonci.it",
      walk: "10 min a pie del Vaticano",
    },
    {
      time: "15:00",
      icon: "🛍️",
      title: "Via del Governo Vecchio · Vintage",
      subtitle: "Via del Governo Vecchio · 5 min del hotel",
      detail: "La calle vintage más especial de Roma, entre Piazza Navona y Campo de' Fiori. Tiendas pequeñas, locales y con carácter. Nada de cadenas. La concentración de tiendas es única en Europa.",
      photo: PHOTOS.govvecchio,
      tipo: "shop",
      maps: "https://www.google.com/maps/search/?api=1&query=Via+del+Governo+Vecchio+Roma",
      walk: "5 min del hotel, en el centro histórico",
    },
    {
      time: "15:15",
      icon: "👗",
      title: "Vestiti Usati Cinzia",
      subtitle: "Via del Governo Vecchio 45",
      detail: "La tienda más querida de la calle. Cinzia lleva décadas seleccionando piezas únicas. Ropa de los 60s, 70s y 80s en perfecto estado. Precios muy justos y atención personalizada. Merece la pena chatear con ella.",
      photo: PHOTOS.vintage,
      tipo: "shop",
      maps: "https://www.google.com/maps/search/?api=1&query=Vestiti+Usati+Cinzia+Via+del+Governo+Vecchio+Roma",
    },
    {
      time: "15:45",
      icon: "🧣",
      title: "Mado · Vintage & Design",
      subtitle: "Via del Governo Vecchio 89",
      detail: "Mezcla perfecta de vintage y diseño contemporáneo italiano. Accesorios, bolsos de cuero artesanales y ropa de temporadas pasadas de marcas italianas. Uno de los locales más instagrameables de Roma.",
      photo: PHOTOS.vintage,
      tipo: "shop",
      maps: "https://www.google.com/maps/search/?api=1&query=Mado+Via+del+Governo+Vecchio+Roma",
    },
    {
      time: "17:00",
      icon: "⛲",
      title: "Campo de' Fiori + Piazza Navona",
      subtitle: "8 min del hotel · Centro Storico",
      detail: "Campo de' Fiori: antigua plaza de mercado con estatua de Giordano Bruno. Ambiente animado. Luego a Piazza Navona (5 min andando) para ver la Fontana dei Quattro Fiumi de Bernini al atardecer, cuando la luz es perfecta para fotos.",
      photo: PHOTOS.navona2,
      tipo: "free",
      maps: "https://www.google.com/maps/search/?api=1&query=Campo+de+Fiori+Roma",
    },
    {
      time: "18:30",
      icon: "🍦",
      title: "Gelato · Fatamorgana · Trastevere",
      subtitle: "Via Roma Libera 11 · Trastevere · 20 min del hotel",
      detail: "La mejor gelatería artesanal de Roma. Ingredientes naturales, sin colorantes. Sabores únicos que no encontraréis en ningún otro sitio: Basilico & Pistacchio, Rosa & lampone, Cioccolato fondente & sale marino. Vegana y sin gluten. Imprescindible.",
      photo: PHOTOS.gelato,
      tipo: "food",
      tag: "La mejor de Roma",
      maps: "https://www.google.com/maps/search/?api=1&query=Gelateria+Fatamorgana+Roma+Libera",
      web: "https://www.gelateriafatamorgana.com",
      walk: "20 min a pie del hotel por Trastevere",
    },
    {
      time: "19:30",
      icon: "🌆",
      title: "Paseo por Trastevere",
      subtitle: "El barrio más fotogénico de Roma",
      detail: "Callejones adoquinados, hiedra en las fachadas, ropa tendida entre ventanas. El barrio bohemio de Roma. Pasead sin rumbo antes de cenar, explorad sus plazas escondidas.",
      photo: PHOTOS.trastevere,
      tipo: "free",
      maps: "https://www.google.com/maps/search/?api=1&query=Trastevere+Roma",
    },
    {
      time: "20:30",
      icon: "🍷",
      title: "Cena de cierre · Tonnarello",
      subtitle: "Via della Paglia 1 · Trastevere",
      detail: "El restaurante más querido de Trastevere. Terraza exterior perfecta para una última noche romana. Pedir: Tonnarelli cacio e pepe (su especialidad), Amatriciana, Saltimbocca alla romana. Vino de la casa espectacular. Reservar si podéis.",
      photo: PHOTOS.trastevere,
      tipo: "food",
      tag: "Cena de cierre ✨",
      maps: "https://www.google.com/maps/search/?api=1&query=Tonnarello+Trastevere+Roma",
      web: "https://www.tonnarello.it",
      walk: "En Trastevere, junto al gelato",
    },
  ],
};

/* ─── Guía de sugerencias ─────────────────────────────────────── */
interface Sugerencia {
  icon: string;
  title: string;
  subtitle: string;
  detail: string;
  maps?: string;
  web?: string;
  badge?: string;
  badgeColor?: string;
}

interface GuiaSeccion {
  id: string;
  emoji: string;
  titulo: string;
  color: string;
  items: Sugerencia[];
}

const GUIA: GuiaSeccion[] = [
  {
    id: "manana",
    emoji: "🌅",
    titulo: "Mañanas",
    color: "#FF9F0A",
    items: [
      {
        icon: "☕",
        title: "Sant'Eustachio il Caffè",
        subtitle: "Piazza di Sant'Eustachio 82 · Centro Storico",
        detail: "El mejor café de Roma. Cappuccino con mezcla secreta desde 1938. Abre 7:30h. A 2 min del hotel.",
        maps: "https://www.google.com/maps/search/?api=1&query=Sant'Eustachio+il+Caffè+Roma",
        web: "https://www.santeustachioilcaffe.it",
        badge: "Histórico",
        badgeColor: "#FF9F0A",
      },
      {
        icon: "🥐",
        title: "Forno Campo de' Fiori",
        subtitle: "Piazza Campo de' Fiori 22 · 8 min del hotel",
        detail: "Horno artesanal desde el siglo XIX. Las mejores pizzas bianche (rellenas de aceituna, cebolla, romero) para desayunar o picar. Siempre hay cola y siempre merece la pena.",
        maps: "https://www.google.com/maps/search/?api=1&query=Forno+Campo+de+Fiori+Roma",
        badge: "Antes de las 10h",
        badgeColor: "#FF6B35",
      },
      {
        icon: "🏪",
        title: "Mercato di Testaccio",
        subtitle: "Via Beniamino Franklin · Testaccio",
        detail: "El mercado de barrio más auténtico de Roma. Puestos de queso, embutidos, fruta, y algunos de los mejores bocadillos de la ciudad. Cierra a las 14h. Si tenéis mañana libre, aquí están los mejores productores locales.",
        maps: "https://www.google.com/maps/search/?api=1&query=Mercato+di+Testaccio+Roma",
        badge: "Abre hasta las 14h",
        badgeColor: "#34C759",
      },
    ],
  },
  {
    id: "tarde",
    emoji: "🌆",
    titulo: "Tardes",
    color: "#5E5CE6",
    items: [
      {
        icon: "🍟",
        title: "Supplì Roma · Campo de' Fiori",
        subtitle: "Via di S. Giovanni in Laterano 32 · también en Campo de' Fiori",
        detail: "El supplì es la versión romana del arancino. Arroz con ragú y mozzarella, rebozado y frito. El de Supplì Roma es el más reconocido. Perfecto para picar a media tarde sin tener que sentarse en ningún sitio.",
        maps: "https://www.google.com/maps/search/?api=1&query=Supplì+Roma+Via+San+Giovanni+Laterano",
        badge: "Snack perfecto",
        badgeColor: "#FF6B35",
      },
      {
        icon: "🏛️",
        title: "Trastevere · Paseo libre",
        subtitle: "Barrio bohemio · 20 min del hotel",
        detail: "El barrio más fotogénico de Roma. Callejones adoquinados, hiedra en las fachadas. Para recorrer a las 17-18h cuando empieza a animarse y la luz es dorada. Sin plan fijo.",
        maps: "https://www.google.com/maps/search/?api=1&query=Trastevere+Roma",
        badge: "La hora dorada",
        badgeColor: "#FF9F0A",
      },
      {
        icon: "⛲",
        title: "Piazza Navona al atardecer",
        subtitle: "5 min del hotel · Centro Storico",
        detail: "La Fontana dei Quattro Fiumi de Bernini cambia completamente al caer el sol. Sin aglomeraciones, con un gelato en mano. Los artistas callejeros también montan aquí.",
        maps: "https://www.google.com/maps/search/?api=1&query=Piazza+Navona+Roma",
      },
    ],
  },
  {
    id: "comer",
    emoji: "🍝",
    titulo: "Dónde comer",
    color: "#FF2D55",
    items: [
      {
        icon: "🍴",
        title: "Roscioli · La carbonara definitiva",
        subtitle: "Via dei Giubbonari 21 · 8 min del hotel",
        detail: "Considerado el mejor restaurante de cocina romana por muchos críticos. Su carbonara es un estándar de referencia. También tienen una delle mejores selecciones de quesos y embutidos italianos del mundo. Reservar con días de antelación.",
        maps: "https://www.google.com/maps/search/?api=1&query=Roscioli+Via+dei+Giubbonari+Roma",
        web: "https://www.salumeriaroscioli.com",
        badge: "Reservar antes",
        badgeColor: "#FF2D55",
      },
      {
        icon: "🐄",
        title: "Flavio al Velavevodetto · Testaccio",
        subtitle: "Via di Monte Testaccio 97 · Testaccio",
        detail: "Cocina romana de tripas. El barrio Testaccio era el matadero de Roma y su gastronomía refleja eso. Coda alla vaccinara (rabo de toro), pajata, rigatoni con pajata. Si os atrevéis, es una experiencia única. Si no, la pasta simple también está entre las mejores.",
        maps: "https://www.google.com/maps/search/?api=1&query=Flavio+al+Velavevodetto+Testaccio+Roma",
        badge: "Auténtico romano",
        badgeColor: "#8E8E93",
      },
      {
        icon: "🥗",
        title: "Osteria dell'Ingegno · cerca del Panthéon",
        subtitle: "Piazza di Pietra 45 · 5 min del hotel",
        detail: "Con vistas a un templo romano de verdad. Cocina romana moderna, carta de vinos de primera. Buena opción si queréis comer cerca del hotel sin andar mucho.",
        maps: "https://www.google.com/maps/search/?api=1&query=Osteria+dell'Ingegno+Roma+Piazza+di+Pietra",
      },
    ],
  },
  {
    id: "tomar",
    emoji: "🍸",
    titulo: "Tomar algo · Vermouths",
    color: "#AF52DE",
    items: [
      {
        icon: "🍷",
        title: "Bar San Calisto · Trastevere",
        subtitle: "Piazza San Calisto 3 · Trastevere",
        detail: "El bar más auténtico y asequible de Roma. Vermut y Campari soda a menos de 2€. Sin decoración, sin turistas, lleno de romanos. El vermouth de la casa es el mejor que vais a tomar. La terraza de la plaza es perfecta al caer la tarde.",
        maps: "https://www.google.com/maps/search/?api=1&query=Bar+San+Calisto+Trastevere+Roma",
        badge: "El más auténtico",
        badgeColor: "#AF52DE",
      },
      {
        icon: "🍹",
        title: "Freni e Frizioni · Trastevere",
        subtitle: "Via del Politeama 4 · Trastevere",
        detail: "Antigua gasolinera reconvertida en bar. El aperitivo empieza a las 18:30h con buffet libre incluido en la copa (normalmente 10€). Spritz, Negroni, Americano. Terraza exterior muy animada.",
        maps: "https://www.google.com/maps/search/?api=1&query=Freni+e+Frizioni+Trastevere+Roma",
        web: "https://www.freniefrizioni.com",
        badge: "Buffet aperitivo 18:30h",
        badgeColor: "#FF9F0A",
      },
      {
        icon: "🫗",
        title: "Il Sorpasso · Prati",
        subtitle: "Via Properzio 31 · Prati (cerca del Vaticano)",
        detail: "Barra de vermouths y vinos naturales. Carta de más de 30 referencias. Perfecto si estáis en Prati tras el Vaticano. También sirven comida hasta tarde. Decoración de bodega vintage muy cuidada.",
        maps: "https://www.google.com/maps/search/?api=1&query=Il+Sorpasso+Prati+Roma",
        web: "https://www.ilsorpasso.com",
        badge: "30+ vermouths",
        badgeColor: "#5E5CE6",
      },
    ],
  },
  {
    id: "tiendas",
    emoji: "🛍️",
    titulo: "Tiendas · Reventa & Joyas ocultas",
    color: "#34C759",
    items: [
      {
        icon: "🏷️",
        title: "Mercato Monti Urban Market",
        subtitle: "Via Leonina 46 · Hotel Palatino · Monti",
        detail: "Mercadillo interior de fin de semana (sábado y domingo) con vendedores seleccionados. Mezcla de vintage de calidad, diseñadores emergentes italianos y piezas únicas. Ropa, calzado, accesorios. Muy diferente al Porta Portese — más curado y con mejor calidad.",
        maps: "https://www.google.com/maps/search/?api=1&query=Mercato+Monti+Urban+Market+Roma",
        web: "https://www.mercatomonti.com",
        badge: "Fin de semana",
        badgeColor: "#34C759",
      },
      {
        icon: "🧥",
        title: "Le Gallinelle · Monti",
        subtitle: "Via del Boschetto 76 · Monti",
        detail: "La tienda más especial de Monti. Wilma Silvestri, la propietaria, lleva décadas recogiendo piezas únicas: tejidos antiguos, bordados a mano, trajes de los 60s-70s impecables. No es barato, pero lo que hay dentro no lo vais a encontrar en ningún otro sitio.",
        maps: "https://www.google.com/maps/search/?api=1&query=Le+Gallinelle+Via+del+Boschetto+Roma",
        badge: "Pieza única garantizada",
        badgeColor: "#FF9F0A",
      },
      {
        icon: "👟",
        title: "InOrOut · Sneakers & Streetwear · Monti",
        subtitle: "Via Urbana 24 · Monti",
        detail: "Tienda de reventa de zapatillas y ropa de street de segunda mano. Nike vintage, Adidas de edición limitada, Supreme usado. Todo seleccionado. Si sois de zapatillas, aquí pueden aparecer joyas que en España no vais a ver ni en eBay.",
        maps: "https://www.google.com/maps/search/?api=1&query=InOrOut+Via+Urbana+Roma",
        badge: "Sneakers reventa",
        badgeColor: "#5E5CE6",
      },
      {
        icon: "👗",
        title: "Vestiti Usati Cinzia · Gov. Vecchio",
        subtitle: "Via del Governo Vecchio 45 · Centro Storico",
        detail: "Segunda mano pura. Cinzia vende por peso en algunos momentos del año. Ropa sin seleccionar de verdad: tienes que buscar entre perchas, pero las joyas están ahí. Americana italiana de los 80s, vestidos de seda, chaquetas de cuero. La experiencia de buscar como en un rastrillo de calidad.",
        maps: "https://www.google.com/maps/search/?api=1&query=Vestiti+Usati+Cinzia+Via+Governo+Vecchio+Roma",
        badge: "A veces por peso",
        badgeColor: "#FF2D55",
      },
      {
        icon: "🪡",
        title: "Omero & Cecilia · Gov. Vecchio",
        subtitle: "Via del Governo Vecchio 110 · Centro Storico",
        detail: "Segunda mano mezclada con piezas de diseñador. Aquí encontraréis tanto un vestido de los 70s a 10€ como un abrigo de Marni de segunda mano. Sin orden aparente, hay que buscar. Los mejores días son entre semana cuando no hay turistas.",
        maps: "https://www.google.com/maps/search/?api=1&query=Omero+Cecilia+Via+Governo+Vecchio+Roma",
        badge: "Mezcla high-low",
        badgeColor: "#AF52DE",
      },
      {
        icon: "✨",
        title: "Cherché Mi · Segunda mano diseñador",
        subtitle: "Via del Governo Vecchio 22 · Centro Storico",
        detail: "Consignment store de diseñador. Prada, Gucci, Miu Miu, Valentino de segunda mano con garantía de autenticidad. Si buscáis una joya de diseño italiano sin pagar precio de boutique, aquí es. Precios desde 30€ hasta varios cientos según pieza.",
        maps: "https://www.google.com/maps/search/?api=1&query=Cherché+Mi+Via+del+Governo+Vecchio+Roma",
        badge: "Diseñador 2ª mano",
        badgeColor: "#FF9F0A",
      },
      {
        icon: "🎽",
        title: "Pigneto Vintage · Barrio Pigneto",
        subtitle: "Via del Pigneto · Pigneto (NE Roma)",
        detail: "El barrio Pigneto es el más 'underground' de Roma. Varias tiendas sin nombre oficial que abren de forma irregular, llenas de ropa sin precio fijado donde se negocia. Si tenéis tiempo libre y ganas de descubrir algo, aquí es donde los romanos más fashionistas compran. Vale la excursión.",
        maps: "https://www.google.com/maps/search/?api=1&query=Pigneto+Roma+vintage",
        badge: "Off the radar",
        badgeColor: "#34C759",
      },
    ],
  },
  {
    id: "gelato",
    emoji: "🍦",
    titulo: "Helados · Los mejores",
    color: "#64D2FF",
    items: [
      {
        icon: "🍦",
        title: "Fatamorgana · Trastevere",
        subtitle: "Via Roma Libera 11 · Trastevere",
        detail: "La mejor de Roma. Ingredientes naturales, sabores únicos: Basilico e Pistacchio, Rosa e Lampone, Cioccolato fondente e sale marino. Vegana y sin gluten pero para todos. Imprescindible.",
        maps: "https://www.google.com/maps/search/?api=1&query=Fatamorgana+Trastevere+Roma",
        web: "https://www.gelateriafatamorgana.com",
        badge: "La mejor de Roma",
        badgeColor: "#FF2D55",
      },
      {
        icon: "🍨",
        title: "Giolitti · Clásico histórico",
        subtitle: "Via degli Uffici del Vicario 40 · 3 min del hotel",
        detail: "Gelatería desde 1900, a 3 minutos del hotel. Sabores tradicionales perfectos. El cioccolato fondente y el pistacchio son los imprescindibles. Perfecta si pasáis por allí sin buscarla.",
        maps: "https://www.google.com/maps/search/?api=1&query=Giolitti+Gelateria+Roma",
        web: "https://www.giolitti.it",
        badge: "Desde 1900 · junto al hotel",
        badgeColor: "#FF9F0A",
      },
    ],
  },
];

/* ─── Countdown hook ──────────────────────────────────────────── */
function useCountdown() {
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, done: false });
  useEffect(() => {
    const tick = () => {
      const d = DEPARTURE.getTime() - Date.now();
      if (d <= 0) { setT({ days: 0, hours: 0, minutes: 0, done: true }); return; }
      setT({ days: Math.floor(d / 86400000), hours: Math.floor((d % 86400000) / 3600000), minutes: Math.floor((d % 3600000) / 60000), done: false });
    };
    tick(); const id = setInterval(tick, 30000); return () => clearInterval(id);
  }, []);
  return t;
}

/* ─── Componentes pequeños ────────────────────────────────────── */
function PhotoImg({ src, alt, h = 180 }: { src: string; alt: string; h?: number }) {
  const [err, setErr] = useState(false);
  if (err) return (
    <div style={{ height: h, borderRadius: 14, background: "linear-gradient(135deg, #1a1a2e, #16213e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, marginBottom: 12 }}>
      🇮🇹
    </div>
  );
  return (
    <img src={src} alt={alt} onError={() => setErr(true)}
      style={{ width: "100%", height: h, objectFit: "cover", borderRadius: 14, marginBottom: 12, display: "block" }} />
  );
}

function LinkBtn({ href, icon, label, color }: { href: string; icon: string; label: string; color: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 20, background: `${color}18`, border: `1px solid ${color}40`, color, fontSize: 11, fontWeight: 700, textDecoration: "none", flexShrink: 0 }}>
      {icon} {label}
    </a>
  );
}

/* ─── Componente Guía ────────────────────────────────────────── */
function GuiaView() {
  const [openSection, setOpenSection] = useState<string | null>("tiendas");

  return (
    <div style={{ padding: "0 16px 48px" }}>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 20px", lineHeight: 1.6 }}>
        No es un itinerario fijo — es una colección de sitios para cuando no sabéis qué hacer o queréis salir de lo típico. Toca cada sección para explorar.
      </p>
      {GUIA.map((sec) => {
        const isOpen = openSection === sec.id;
        return (
          <div key={sec.id} style={{ marginBottom: 12 }}>
            <motion.button whileTap={{ scale: 0.98 }} onClick={() => setOpenSection(isOpen ? null : sec.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: 16, border: `1px solid ${isOpen ? sec.color + "50" : "rgba(255,255,255,0.08)"}`, background: isOpen ? `${sec.color}12` : "rgba(255,255,255,0.04)", cursor: "pointer", fontFamily: "inherit" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>{sec.emoji}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: isOpen ? sec.color : "white" }}>{sec.titulo}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>{sec.items.length} sitios</span>
              </div>
              <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {isOpen && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} style={{ overflow: "hidden" }}>
                  <div style={{ paddingTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                    {sec.items.map((item, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 14px 12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 16 }}>{item.icon}</span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "white" }}>{item.title}</span>
                            {item.badge && (
                              <span style={{ fontSize: 9, fontWeight: 700, color: item.badgeColor, background: `${item.badgeColor}18`, padding: "2px 8px", borderRadius: 20, border: `1px solid ${item.badgeColor}30` }}>
                                {item.badge}
                              </span>
                            )}
                          </div>
                        </div>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 6px" }}>{item.subtitle}</p>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: "0 0 10px", lineHeight: 1.6 }}>{item.detail}</p>
                        {(item.maps || item.web) && (
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {item.maps && <LinkBtn href={item.maps} icon="📍" label="Maps" color={sec.color} />}
                            {item.web && <LinkBtn href={item.web} icon="🌐" label="Web" color="#64D2FF" />}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Página principal ────────────────────────────────────────── */
export default function RomaPage() {
  const params = useParams();
  const router = useRouter();
  const { activeUser, setUser } = useUserStore();
  const userParam = params.user as UserName;

  useEffect(() => {
    if (userParam && userParam !== activeUser) setUser(userParam, userParam);
  }, [userParam, activeUser, setUser]);

  const cd = useCountdown();
  const [day, setDay] = useState<Day>("jueves");
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div style={{ height: "100dvh", overflowY: "auto", overflowX: "hidden", background: "#080810", color: "white", fontFamily: "-apple-system,'SF Pro Display',sans-serif" }}>

      {/* ── Hero ───────────────────────────────────────────── */}
      <div style={{ position: "relative", height: 420 }}>
        <img src={PHOTOS.hero} alt="Roma" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(8,8,16,0.3) 0%, rgba(8,8,16,0.6) 60%, rgba(8,8,16,1) 100%)" }} />

        {/* Back */}
        <button onClick={() => router.back()}
          style={{ position: "absolute", top: `calc(16px + env(safe-area-inset-top))`, left: 16, width: 38, height: 38, borderRadius: "50%", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 5l-7 7 7 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>

        {/* Título */}
        <div style={{ position: "absolute", bottom: 28, left: 0, right: 0, padding: "0 20px", textAlign: "center" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 style={{ fontSize: 42, fontWeight: 900, margin: "0 0 4px", letterSpacing: "-1px", textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>
              Roma 🇮🇹
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", margin: "0 0 20px", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Alejandro & Rut · 24 – 25 Abril 2026
            </p>

            {/* Countdown */}
            {!cd.done ? (
              <div style={{ display: "inline-flex", gap: 0, background: "rgba(255,255,255,0.08)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 18, overflow: "hidden" }}>
                {[{ v: cd.days, l: "días" }, { v: cd.hours, l: "horas" }, { v: cd.minutes, l: "min" }].map(({ v, l }, i) => (
                  <div key={l} style={{ display: "flex", alignItems: "center" }}>
                    <div style={{ padding: "10px 16px", textAlign: "center" }}>
                      <div style={{ fontSize: 26, fontWeight: 800, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{String(v).padStart(2, "0")}</div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>{l}</div>
                    </div>
                    {i < 2 && <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 18, paddingRight: 2 }}>:</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 20, fontWeight: 800, color: "#34C759" }}>¡Estáis en Roma! 🎉</div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Pills de info ────────────────────────────────── */}
      <div style={{ padding: "16px 16px 8px", display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          { icon: "🚌", text: "Bus 05:20 → 08:05" },
          { icon: "🏨", text: "Ele Suites Pantheon" },
          { icon: "🏟️", text: "Coliseo 16:45 Jue" },
          { icon: "⛪", text: "Vaticano Vie" },
          { icon: "🛍️", text: "Monti + Gob. Vecchio" },
        ].map((p) => (
          <div key={p.text} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "6px 12px", fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 500, whiteSpace: "nowrap" }}>
            {p.icon} {p.text}
          </div>
        ))}
      </div>

      {/* ── Tabs ────────────────────────────────────────── */}
      <div style={{ padding: "12px 16px 16px", display: "flex", gap: 6 }}>
        {([
          { id: "jueves", label: "Jue 24" },
          { id: "viernes", label: "Vie 25" },
          { id: "guia", label: "💡 Ideas" },
        ] as { id: Day; label: string }[]).map((tab) => (
          <motion.button key={tab.id} whileTap={{ scale: 0.95 }} onClick={() => { setDay(tab.id); setExpanded(null); }}
            style={{ flex: 1, padding: "11px 6px", borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit", transition: "all 0.2s",
              background: day === tab.id ? "white" : "rgba(255,255,255,0.07)",
              color: day === tab.id ? "#080810" : "rgba(255,255,255,0.4)",
              boxShadow: day === tab.id ? "0 4px 20px rgba(255,255,255,0.15)" : "none",
            }}>
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* ── Contenido ────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {day === "guia" ? (
          <motion.div key="guia" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <GuiaView />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ── Timeline ─────────────────────────────────────── */}
      {day !== "guia" && (
      <div style={{ padding: "0 16px 48px" }}>
        <AnimatePresence mode="wait">
          <motion.div key={day} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
            {ITINERARY[day as ItineraryDay].map((ev, i) => {
              const tc = TYPE[ev.tipo];
              const isOpen = expanded === i;
              return (
                <div key={i}>
                  {/* Indicación de desplazamiento */}
                  {ev.walk && i > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0 4px 20px", marginBottom: 4 }}>
                      <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.08)", marginLeft: 15 }} />
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>🚶 {ev.walk}</span>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 12, marginBottom: 4 }}>
                    {/* Timeline dot */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 32, flexShrink: 0 }}>
                      <motion.div whileTap={{ scale: 0.9 }}
                        style={{ width: 32, height: 32, borderRadius: "50%", background: tc.bg, border: `2px solid ${tc.color}60`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, cursor: "pointer" }}
                        onClick={() => setExpanded(isOpen ? null : i)}>
                        {ev.icon}
                      </motion.div>
                      {i < ITINERARY[day as ItineraryDay].length - 1 && (
                        <div style={{ width: 2, flex: 1, minHeight: 16, background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />
                      )}
                    </div>

                    {/* Card */}
                    <motion.div layout onClick={() => setExpanded(isOpen ? null : i)}
                      style={{ flex: 1, marginBottom: 8, background: isOpen ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)", border: `1px solid ${isOpen ? tc.color + "50" : "rgba(255,255,255,0.07)"}`, borderRadius: 18, overflow: "hidden", cursor: "pointer", transition: "border-color 0.2s, background 0.2s" }}>

                      {/* Foto (solo si expandido y tiene foto) */}
                      <AnimatePresence>
                        {isOpen && ev.photo && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                            <PhotoImg src={ev.photo} alt={ev.title} h={160} />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div style={{ padding: "12px 14px" }}>
                        {/* Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 12, fontWeight: 800, color: tc.color, fontVariantNumeric: "tabular-nums" }}>{ev.time}</span>
                              {ev.tag && (
                                <span style={{ fontSize: 9, fontWeight: 700, color: tc.color, background: tc.bg, padding: "2px 8px", borderRadius: 20, border: `1px solid ${tc.color}30` }}>
                                  {ev.tag}
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: 15, fontWeight: 700, color: "white", margin: "0 0 2px", lineHeight: 1.3 }}>{ev.title}</p>
                            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.4 }}>{ev.subtitle}</p>
                          </div>
                          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ marginTop: 6, flexShrink: 0 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </motion.div>
                        </div>

                        {/* Detalle expandido */}
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
                              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", margin: "10px 0 12px", lineHeight: 1.65, overflow: "hidden" }}>
                                {ev.detail}
                              </p>
                              {/* Botones */}
                              {(ev.maps || ev.web) && (
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                  {ev.maps && <LinkBtn href={ev.maps} icon="📍" label="Ver en Maps" color={tc.color} />}
                                  {ev.web && <LinkBtn href={ev.web} icon="🌐" label="Web oficial" color="#64D2FF" />}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
      )}
    </div>
  );
}

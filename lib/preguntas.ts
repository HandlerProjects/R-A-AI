import { supabase } from "./supabase";

export interface Pregunta {
  id: string;
  date: string;
  text: string;
  tipo: "predice" | "opinion" | "recuerda";
}

export interface PreguntaRespuesta {
  id: string;
  pregunta_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

const PREGUNTAS: { text: string; tipo: "predice" | "opinion" | "recuerda" }[] = [
  { text: "¿Qué crees que está haciendo el otro ahora mismo?", tipo: "predice" },
  { text: "¿Cuál es tu mayor ilusión para los próximos 6 meses?", tipo: "opinion" },
  { text: "¿Cuál fue el primer momento en que supiste que el otro era especial?", tipo: "recuerda" },
  { text: "¿Qué crees que el otro diría que es tu mejor cualidad?", tipo: "predice" },
  { text: "¿Qué lugar del mundo os gustaría visitar juntos?", tipo: "opinion" },
  { text: "¿Recuerdas la primera vez que os reísteis de verdad juntos? ¿De qué fue?", tipo: "recuerda" },
  { text: "¿Qué crees que el otro está echando más de menos ahora mismo?", tipo: "predice" },
  { text: "¿Cómo imaginas vuestra vida dentro de 5 años?", tipo: "opinion" },
  { text: "¿Cuál ha sido el mejor plan que habéis hecho juntos?", tipo: "recuerda" },
  { text: "¿Qué crees que le hace más feliz al otro en el día a día?", tipo: "predice" },
  { text: "Si pudierais vivir en cualquier ciudad, ¿cuál elegiríais?", tipo: "opinion" },
  { text: "¿Recuerdas algún momento en que el otro te sorprendió de verdad?", tipo: "recuerda" },
  { text: "¿Qué crees que el otro tiene pendiente hacer esta semana?", tipo: "predice" },
  { text: "¿Cuál sería el plan perfecto para un sábado juntos?", tipo: "opinion" },
  { text: "¿Cuál fue el momento más ridículo que habéis vivido juntos?", tipo: "recuerda" },
  { text: "¿Qué crees que el otro necesita escuchar hoy?", tipo: "predice" },
  { text: "¿Qué es lo más importante para vosotros en una relación?", tipo: "opinion" },
  { text: "¿Cuál es el mensaje o momento que más has guardado en el corazón?", tipo: "recuerda" },
  { text: "¿Qué le regalarías al otro si el dinero no importara?", tipo: "opinion" },
  { text: "¿Cómo crees que el otro describiría vuestra relación a un extraño?", tipo: "predice" },
  { text: "¿Qué pequeño hábito del otro te encanta aunque sea tonto?", tipo: "opinion" },
  { text: "¿Recuerdas la primera foto que os hicisteis juntos? ¿Qué hacíais?", tipo: "recuerda" },
  { text: "¿Qué crees que el otro está pensando justo antes de dormirse?", tipo: "predice" },
  { text: "¿Qué es lo que más os ha unido como pareja?", tipo: "opinion" },
  { text: "¿Cuál fue la primera vez que el otro te dijo algo que te llegó de verdad?", tipo: "recuerda" },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getPreguntaForDate(dateStr: string): { text: string; tipo: "predice" | "opinion" | "recuerda" } {
  const d = new Date(dateStr);
  const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
  return PREGUNTAS[dayOfYear % PREGUNTAS.length];
}

export async function getTodayPregunta(): Promise<Pregunta> {
  const today = todayStr();
  const { data } = await supabase.from("preguntas").select("*").eq("date", today).single();
  if (data) return data;
  const p = getPreguntaForDate(today);
  const { data: created } = await supabase.from("preguntas").insert({ date: today, text: p.text, tipo: p.tipo }).select().single();
  return created ?? { id: "local", date: today, text: p.text, tipo: p.tipo };
}

export async function getPreguntaRespuestas(preguntaId: string): Promise<PreguntaRespuesta[]> {
  const { data } = await supabase.from("preguntas_respuestas").select("*").eq("pregunta_id", preguntaId);
  return data ?? [];
}

export async function savePreguntaRespuesta(preguntaId: string, userName: string, content: string): Promise<void> {
  await supabase.from("preguntas_respuestas").upsert({ pregunta_id: preguntaId, user_name: userName, content }, { onConflict: "pregunta_id,user_name" });
}

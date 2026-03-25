import { supabase } from "./supabase";

export interface Reto {
  id: string;
  date: string;
  text: string;
}

export interface RetoRespuesta {
  id: string;
  reto_id: string;
  user_name: string;
  content: string;
  photo_url: string | null;
  created_at: string;
}

const RETOS: string[] = [
  "Haz una foto de lo más bonito que hayas visto hoy",
  "Escribe la canción que más te recuerda al otro ahora mismo",
  "Dibuja algo aunque sea mal — lo que tengas en la cabeza",
  "Escribe 3 cosas que te han hecho sonreír hoy",
  "Haz una foto de tu rincón favorito de donde estás",
  "Escribe cómo imaginas el próximo reencuentro",
  "Comparte algo que has aprendido esta semana",
  "Haz una foto de lo que estás comiendo ahora",
  "Escribe una cosa que te da miedo y una que te emociona del futuro",
  "Haz una foto del cielo desde donde estás",
  "Describe tu día en exactamente 5 palabras",
  "Escribe algo que nunca le has dicho al otro",
  "Haz una foto de algo que te recuerde a vuestra relación",
  "Escribe cuál sería tu plan perfecto para este fin de semana",
  "Comparte algo que te haya hecho reír esta semana",
  "Haz una foto de tus manos haciendo algo",
  "Escribe una pregunta que llevas tiempo queriendo hacer",
  "Describe al otro en 3 emojis y explica por qué",
  "Haz una foto de algo pequeño que normalmente no notas",
  "Escribe qué harías si tuvieras un día libre sin obligaciones",
  "Comparte una canción nueva que hayas descubierto",
  "Haz una foto de la vista desde donde trabajas o estudias",
  "Escribe cómo te has sentido hoy en una sola frase honesta",
  "Comparte algo que te tiene ilusionado esta semana",
  "Haz una foto de algo azul",
  "Escribe un recuerdo vuestro que siempre te hace sonreír",
  "Comparte algo que has cocinado o comido hoy",
  "Haz una foto de algo que representa cómo te sientes ahora",
  "Escribe tres cosas que valoras del otro",
  "Comparte algo que quieres aprender o hacer este año",
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getRetoForDate(dateStr: string): string {
  const d = new Date(dateStr);
  const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
  return RETOS[dayOfYear % RETOS.length];
}

export async function getTodayReto(): Promise<Reto> {
  const today = todayStr();
  const { data } = await supabase.from("retos").select("*").eq("date", today).single();
  if (data) return data;
  const text = getRetoForDate(today);
  const { data: created } = await supabase.from("retos").insert({ date: today, text }).select().single();
  return created ?? { id: "local", date: today, text };
}

export async function getRespuestas(retoId: string): Promise<RetoRespuesta[]> {
  const { data } = await supabase.from("retos_respuestas").select("*").eq("reto_id", retoId);
  return data ?? [];
}

export async function saveRespuesta(retoId: string, userName: string, content: string, photoUrl?: string | null): Promise<void> {
  await supabase.from("retos_respuestas").upsert(
    { reto_id: retoId, user_name: userName, content, photo_url: photoUrl ?? null },
    { onConflict: "reto_id,user_name" }
  );
}

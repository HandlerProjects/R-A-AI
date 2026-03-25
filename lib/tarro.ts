import { supabase } from "./supabase";

export type TipoMomento = "romantico" | "gracioso" | "sueno" | "especial";

export interface Momento {
  id: string;
  user_name: string;
  text: string;
  tipo: TipoMomento;
  photo_url: string | null;
  created_at: string;
}

export const TIPO_CONFIG: Record<TipoMomento, { color: string; bg: string; emoji: string; label: string }> = {
  romantico: { color: "#FF2D55", bg: "#FFF0F3", emoji: "💗", label: "Romántico" },
  gracioso:  { color: "#FF9F0A", bg: "#FFF8E7", emoji: "😂", label: "Gracioso"  },
  sueno:     { color: "#007AFF", bg: "#EFF6FF", emoji: "🌙", label: "Sueño"     },
  especial:  { color: "#AF52DE", bg: "#F5EEFF", emoji: "✨", label: "Especial"  },
};

export async function loadMomentos(): Promise<Momento[]> {
  const { data } = await supabase
    .from("tarro_momentos")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as Momento[];
}

export async function saveMomento(userName: string, text: string, tipo: TipoMomento, photoUrl?: string | null): Promise<Momento | null> {
  const { data, error } = await supabase
    .from("tarro_momentos")
    .insert({ user_name: userName, text, tipo, photo_url: photoUrl ?? null })
    .select()
    .single();
  if (error || !data) return null;
  return data as Momento;
}

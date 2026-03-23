import { supabase } from "./supabase";

export interface Detalle {
  id: string;
  text: string;
  date: string; // YYYY-MM-DD
  created_at?: string;
}

export async function loadDetalles(userId: string): Promise<Detalle[]> {
  const { data, error } = await supabase
    .from("yopuedo_detalles")
    .select("id, text, date, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(60);

  if (error || !data) return [];
  return data;
}

export async function saveDetalle(
  userId: string,
  text: string,
  date: string
): Promise<Detalle | null> {
  const { data, error } = await supabase
    .from("yopuedo_detalles")
    .insert({ user_id: userId, text, date })
    .select("id, text, date, created_at")
    .single();

  if (error || !data) return null;
  return data;
}

export async function loadSueno(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from("yopuedo_sueno")
    .select("text")
    .eq("user_id", userId)
    .single();

  if (error || !data) return "";
  return data.text;
}

export async function saveSueno(userId: string, text: string): Promise<void> {
  await supabase
    .from("yopuedo_sueno")
    .upsert({ user_id: userId, text, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
}

import { supabase } from "./supabase";

export type TipoIntimidad = "follar" | "chupada_ella" | "chupada_el";

export interface IntimidadEntry {
  id: string;
  tipo: TipoIntimidad;
  fecha: string;
  created_at: string;
}

export async function loadMes(year: number, month: number): Promise<IntimidadEntry[]> {
  const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const to = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("intimidad_registro")
    .select("*")
    .gte("fecha", from)
    .lte("fecha", to)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data as IntimidadEntry[];
}

export async function addEntrada(tipo: TipoIntimidad, fecha: string): Promise<IntimidadEntry | null> {
  const { data, error } = await supabase
    .from("intimidad_registro")
    .insert({ tipo, fecha })
    .select()
    .single();
  if (error || !data) return null;
  return data as IntimidadEntry;
}

export async function deleteEntrada(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("intimidad_registro")
    .delete()
    .eq("id", id);
  return !error;
}

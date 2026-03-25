import { supabase } from "./supabase";

export interface Preferia {
  id: string;
  text: string;
  option_a: string;
  option_b: string;
  created_by: string;
  created_at: string;
}

export interface PreferiaRespuesta {
  id: string;
  preferia_id: string;
  user_name: string;
  answer: "a" | "b";
  created_at: string;
}

export async function getPreferias(): Promise<Preferia[]> {
  const { data } = await supabase
    .from("preferias")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function createPreferia(
  text: string,
  optionA: string,
  optionB: string,
  createdBy: string
): Promise<Preferia | null> {
  const { data } = await supabase
    .from("preferias")
    .insert({ text, option_a: optionA, option_b: optionB, created_by: createdBy })
    .select()
    .single();
  return data ?? null;
}

export async function getPreferiaRespuestas(preferiaId: string): Promise<PreferiaRespuesta[]> {
  const { data } = await supabase
    .from("preferias_respuestas")
    .select("*")
    .eq("preferia_id", preferiaId);
  return data ?? [];
}

export async function getAllRespuestas(): Promise<PreferiaRespuesta[]> {
  const { data } = await supabase
    .from("preferias_respuestas")
    .select("*");
  return data ?? [];
}

export async function savePreferiaRespuesta(
  preferiaId: string,
  userName: string,
  answer: "a" | "b"
): Promise<void> {
  await supabase.from("preferias_respuestas").upsert(
    { preferia_id: preferiaId, user_name: userName, answer },
    { onConflict: "preferia_id,user_name" }
  );
}

import { supabase } from "./supabase";

export interface Carta {
  id: string;
  from_user: string;
  to_user: string;
  text: string;
  deliver_at: string; // YYYY-MM-DD
  read_at: string | null;
  notified: boolean;
  favorito: boolean;
  created_at: string;
}

export function todayDateStr() {
  return new Date().toISOString().slice(0, 10);
}

export async function saveCarta(
  fromUser: string,
  toUser: string,
  text: string,
  deliverAt: string
): Promise<Carta | null> {
  const { data, error } = await supabase
    .from("cartas")
    .insert({ from_user: fromUser, to_user: toUser, text, deliver_at: deliverAt, notified: false })
    .select()
    .single();
  if (error || !data) return null;
  return data;
}

export async function loadCartasEnviadas(fromUser: string): Promise<Carta[]> {
  const { data, error } = await supabase
    .from("cartas")
    .select("*")
    .eq("from_user", fromUser)
    .order("deliver_at", { ascending: false });
  if (error || !data) return [];
  return data;
}

export async function loadCartasRecibidas(toUser: string): Promise<Carta[]> {
  const today = todayDateStr();
  const { data, error } = await supabase
    .from("cartas")
    .select("*")
    .eq("to_user", toUser)
    .lte("deliver_at", today)
    .order("deliver_at", { ascending: false });
  if (error || !data) return [];
  return data;
}

export async function markCartaRead(cartaId: string): Promise<void> {
  await supabase
    .from("cartas")
    .update({ read_at: new Date().toISOString() })
    .eq("id", cartaId);
}

export async function toggleFavorito(cartaId: string, current: boolean): Promise<void> {
  await supabase
    .from("cartas")
    .update({ favorito: !current })
    .eq("id", cartaId);
}

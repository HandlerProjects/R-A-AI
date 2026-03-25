import { supabase } from "./supabase";

export interface Voto {
  id: string;
  module: string;
  item_id: string;
  voter: string;
  voted_for: string;
  created_at: string;
}

export async function getVotos(module: string, itemId: string): Promise<Voto[]> {
  const { data } = await supabase
    .from("daily_votos")
    .select("*")
    .eq("module", module)
    .eq("item_id", itemId);
  return data ?? [];
}

export async function saveVoto(
  module: string,
  itemId: string,
  voter: string,
  votedFor: string
): Promise<void> {
  await supabase.from("daily_votos").upsert(
    { module, item_id: itemId, voter, voted_for: votedFor },
    { onConflict: "module,item_id,voter" }
  );
}

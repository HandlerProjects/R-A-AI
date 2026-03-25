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

export interface ModuleStats {
  alejandro: number;
  rut: number;
  empates: number;
}

/** Calcula victorias históricas y empates para un módulo (reto/pregunta). */
export async function getModuleStats(module: string): Promise<ModuleStats> {
  const { data } = await supabase
    .from("daily_votos")
    .select("item_id, voter, voted_for")
    .eq("module", module);

  if (!data || data.length === 0) return { alejandro: 0, rut: 0, empates: 0 };

  // Agrupar por item_id
  const byItem: Record<string, { voter: string; voted_for: string }[]> = {};
  for (const v of data) {
    if (!byItem[v.item_id]) byItem[v.item_id] = [];
    byItem[v.item_id].push(v);
  }

  let alejandro = 0, rut = 0, empates = 0;
  for (const votes of Object.values(byItem)) {
    const vAle = votes.find((v) => v.voter === "alejandro");
    const vRut = votes.find((v) => v.voter === "rut");
    if (!vAle || !vRut) continue; // ambos deben haber votado
    if (vAle.voted_for === vRut.voted_for) {
      if (vAle.voted_for === "alejandro") alejandro++;
      else rut++;
    } else {
      empates++;
    }
  }

  return { alejandro, rut, empates };
}

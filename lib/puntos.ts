import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface PuntosSaldo {
  user_name: string;
  puntos: number;
  updated_at: string;
}

export interface PuntosHistorial {
  id: string;
  user_name: string;
  applied_by: string;
  valor: number;
  motivo: string;
  created_at: string;
}

export interface PuntosAccion {
  id: string;
  texto: string;
  valor: number;
  tipo: "ganar" | "perder" | "recuperar";
  created_at: string;
}

export async function getSaldos(): Promise<{ alejandro: number; rut: number }> {
  const { data } = await supabase.from("puntos_saldo").select("*");
  const ale = data?.find((d) => d.user_name === "alejandro")?.puntos ?? 0;
  const rut = data?.find((d) => d.user_name === "rut")?.puntos ?? 0;
  return { alejandro: ale, rut };
}

export async function getHistorial(limit = 30): Promise<PuntosHistorial[]> {
  const { data } = await supabase
    .from("puntos_historial")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getAcciones(): Promise<PuntosAccion[]> {
  const { data } = await supabase
    .from("puntos_acciones")
    .select("*")
    .order("created_at", { ascending: true });
  return (data ?? []) as PuntosAccion[];
}

export async function aplicarAccion(
  targetUser: string,
  appliedBy: string,
  accion: PuntosAccion
): Promise<void> {
  // Get current balance
  const { data: current } = await supabase
    .from("puntos_saldo")
    .select("puntos")
    .eq("user_name", targetUser)
    .single();

  const currentPuntos = current?.puntos ?? 0;
  const newPuntos = Math.max(0, currentPuntos + accion.valor);

  await supabase.from("puntos_saldo").upsert(
    { user_name: targetUser, puntos: newPuntos, updated_at: new Date().toISOString() },
    { onConflict: "user_name" }
  );

  await supabase.from("puntos_historial").insert({
    user_name: targetUser,
    applied_by: appliedBy,
    valor: accion.valor,
    motivo: accion.texto,
  });
}

/** Otorga puntos automáticamente (sin acción manual) */
export async function awardPoints(
  targetUser: string,
  valor: number,
  motivo: string
): Promise<void> {
  const { data: current } = await supabase
    .from("puntos_saldo")
    .select("puntos")
    .eq("user_name", targetUser)
    .single();

  const newPuntos = Math.max(0, (current?.puntos ?? 0) + valor);

  await supabase.from("puntos_saldo").upsert(
    { user_name: targetUser, puntos: newPuntos, updated_at: new Date().toISOString() },
    { onConflict: "user_name" }
  );

  await supabase.from("puntos_historial").insert({
    user_name: targetUser,
    applied_by: "sistema",
    valor,
    motivo,
  });
}

export async function addAccion(
  texto: string,
  valor: number,
  tipo: "ganar" | "perder" | "recuperar"
): Promise<void> {
  await supabase.from("puntos_acciones").insert({ texto, valor, tipo });
}

export async function deleteAccion(id: string): Promise<void> {
  await supabase.from("puntos_acciones").delete().eq("id", id);
}

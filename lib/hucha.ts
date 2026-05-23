import { supabase } from "./supabase";

export interface HuchaEntry {
  id: string;
  user_name: string;
  amount: number;
  created_at: string;
}

export interface HuchaStats {
  total: number;
  totalRut: number;
  totalAlejandro: number;
  entries: HuchaEntry[];
}

export async function loadHucha(): Promise<HuchaStats> {
  const { data, error } = await supabase
    .from("hucha_contribuciones")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return { total: 0, totalRut: 0, totalAlejandro: 0, entries: [] };

  const total = data.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalRut = data.filter((e) => e.user_name === "rut").reduce((sum, e) => sum + Number(e.amount), 0);
  const totalAlejandro = data.filter((e) => e.user_name === "alejandro").reduce((sum, e) => sum + Number(e.amount), 0);

  return { total, totalRut, totalAlejandro, entries: data };
}

export async function addContribucion(userName: string): Promise<HuchaEntry | null> {
  const { data, error } = await supabase
    .from("hucha_contribuciones")
    .insert({ user_name: userName, amount: 1 })
    .select()
    .single();
  if (error || !data) return null;
  return data;
}

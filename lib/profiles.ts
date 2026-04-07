import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface UserProfile {
  user_name: string;
  photo_url: string | null;
  apodo: string | null;
  fecha_inicio: string | null;
  firma_url: string | null;
  firma_at: string | null;
  updated_at: string;
}

export async function getProfile(userName: string): Promise<UserProfile | null> {
  const { data } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_name", userName)
    .single();
  return data ?? null;
}

export async function getBothProfiles(): Promise<{ alejandro: UserProfile | null; rut: UserProfile | null }> {
  const { data } = await supabase.from("user_profiles").select("*");
  const alejandro = data?.find((p) => p.user_name === "alejandro") ?? null;
  const rut = data?.find((p) => p.user_name === "rut") ?? null;
  return { alejandro, rut };
}

export async function upsertProfile(
  userName: string,
  fields: Partial<Omit<UserProfile, "user_name" | "updated_at">>
): Promise<void> {
  await supabase
    .from("user_profiles")
    .upsert({ user_name: userName, ...fields, updated_at: new Date().toISOString() }, { onConflict: "user_name" });
}

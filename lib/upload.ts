import { supabase } from "./supabase";

export async function uploadPhoto(file: File, folder: string): Promise<string | null> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from("ra-photos").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) return null;

  const { data } = supabase.storage.from("ra-photos").getPublicUrl(path);
  return data.publicUrl;
}

import { supabase } from "./supabase";

export async function getUserId(userName: "alejandro" | "rut"): Promise<string | null> {
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("name", userName)
    .single();

  if (error || !data) return null;
  return data.id;
}

export async function loadMemories(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from("memories")
    .select("category, content, importance")
    .eq("user_id", userId)
    .order("importance", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(30);

  if (error || !data || data.length === 0) return "";

  return data
    .map((m) => `[${m.category}] ${m.content}`)
    .join("\n");
}

export async function loadSharedMemories(): Promise<string> {
  const { data, error } = await supabase
    .from("shared_memories")
    .select("category, content, importance")
    .order("importance", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data || data.length === 0) return "";

  return data
    .map((m) => `[${m.category}] ${m.content}`)
    .join("\n");
}

export async function saveMemory(
  userId: string,
  category: string,
  content: string,
  importance = 1
): Promise<void> {
  await supabase.from("memories").insert({
    user_id: userId,
    category,
    content,
    importance,
  });
}

export async function saveSharedMemory(
  category: string,
  content: string,
  importance = 1
): Promise<void> {
  await supabase.from("shared_memories").insert({
    category,
    content,
    importance,
  });
}

export async function loadConversation(
  userId: string,
  module: string
): Promise<{ id: string; messages: { role: string; content: string }[] } | null> {
  const { data, error } = await supabase
    .from("conversations")
    .select("id, messages")
    .eq("user_id", userId)
    .eq("module", module)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data;
}

export async function saveConversation(
  userId: string,
  module: string,
  messages: { role: string; content: string }[],
  existingId?: string
): Promise<string | null> {
  if (existingId) {
    await supabase
      .from("conversations")
      .update({ messages, updated_at: new Date().toISOString() })
      .eq("id", existingId);
    return existingId;
  } else {
    const { data } = await supabase
      .from("conversations")
      .insert({ user_id: userId, module, messages })
      .select("id")
      .single();
    return data?.id ?? null;
  }
}

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserName = "alejandro" | "rut";

export interface Memory {
  id: string;
  user_id: string;
  category: string;
  content: string;
  importance: number;
  created_at: string;
}

export interface SharedMemory {
  id: string;
  category: string;
  content: string;
  importance: number;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  module: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

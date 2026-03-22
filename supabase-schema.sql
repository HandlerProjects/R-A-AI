-- ============================================
-- R&A — Schema Supabase
-- Ejecutar en el SQL Editor de Supabase
-- ============================================

-- Tabla de usuarios (solo 2 registros fijos)
CREATE TABLE IF NOT EXISTS users (
  id   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,   -- 'alejandro' | 'rut'
  avatar TEXT,          -- color hex del avatar
  role TEXT             -- 'developer' | 'psychologist'
);

-- Insertar los dos usuarios fijos
INSERT INTO users (name, avatar, role) VALUES
  ('alejandro', '#1D1D1F', 'developer'),
  ('rut', '#FF2D55', 'psychologist')
ON CONFLICT DO NOTHING;

-- Memoria individual (por usuario)
CREATE TABLE IF NOT EXISTS memories (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES users(id) NOT NULL,
  category   TEXT NOT NULL,
  content    TEXT NOT NULL,
  importance INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memoria compartida de pareja
CREATE TABLE IF NOT EXISTS shared_memories (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category   TEXT NOT NULL,   -- 'plans' | 'italian' | 'couple'
  content    TEXT NOT NULL,
  importance INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversaciones (por usuario, por módulo)
CREATE TABLE IF NOT EXISTS conversations (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES users(id) NOT NULL,
  module     TEXT NOT NULL,
  messages   JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Armario (Alejandro)
CREATE TABLE IF NOT EXISTS wardrobe (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES users(id) NOT NULL,
  name       TEXT NOT NULL,
  category   TEXT NOT NULL,
  colors     TEXT[],
  photo_url  TEXT,
  tags       TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TFG de Rut
CREATE TABLE IF NOT EXISTS tfg_documents (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES users(id) NOT NULL,
  title      TEXT NOT NULL,
  content    TEXT,
  url        TEXT,
  type       TEXT,   -- 'bibliography' | 'chapter' | 'note' | 'link'
  tags       TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS memories_user_id_idx ON memories(user_id);
CREATE INDEX IF NOT EXISTS conversations_user_module_idx ON conversations(user_id, module);
CREATE INDEX IF NOT EXISTS tfg_documents_user_id_idx ON tfg_documents(user_id);

-- RLS (Row Level Security) — desactivado porque no hay auth
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE memories DISABLE ROW LEVEL SECURITY;
ALTER TABLE shared_memories DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE wardrobe DISABLE ROW LEVEL SECURITY;
ALTER TABLE tfg_documents DISABLE ROW LEVEL SECURITY;

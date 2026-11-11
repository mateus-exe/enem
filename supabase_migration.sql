-- =============================================================================
-- MIGRATIONS SUPABASE — Plataforma ENEM
-- Execute este script no SQL Editor do seu projeto Supabase:
-- https://supabase.com/dashboard -> seu projeto -> SQL Editor -> New query
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tabela de respostas dos usuários
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_answers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id          UUID NOT NULL,
  question_key        TEXT NOT NULL,          -- Formato: "2023-15"
  exam_year           INT  NOT NULL,
  exam_day            SMALLINT NOT NULL CHECK (exam_day IN (1, 2)),
  discipline          TEXT NOT NULL,
  selected_letter     CHAR(1) NOT NULL,
  correct_letter      CHAR(1) NOT NULL,
  is_correct          BOOLEAN NOT NULL,
  time_spent_seconds  INT NOT NULL DEFAULT 0,
  answered_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para as queries mais comuns
CREATE INDEX IF NOT EXISTS idx_user_answers_user_id     ON public.user_answers (user_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_answered_at ON public.user_answers (user_id, answered_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_answers_discipline  ON public.user_answers (user_id, discipline);

-- ---------------------------------------------------------------------------
-- 2. Tabela de questões favoritas
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.favorites (
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_key  TEXT NOT NULL,
  year          INT  NOT NULL,
  "index"       INT  NOT NULL,
  discipline    TEXT NOT NULL,
  added_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, question_key)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites (user_id);

-- ---------------------------------------------------------------------------
-- 3. Row Level Security (RLS) — cada usuário só acessa seus próprios dados
-- ---------------------------------------------------------------------------

-- Habilita RLS nas tabelas
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites    ENABLE ROW LEVEL SECURITY;

-- Políticas para user_answers
CREATE POLICY "Usuário lê suas próprias respostas"
  ON public.user_answers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário insere suas próprias respostas"
  ON public.user_answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário atualiza suas próprias respostas"
  ON public.user_answers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário deleta suas próprias respostas"
  ON public.user_answers FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para favorites
CREATE POLICY "Usuário lê seus próprios favoritos"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário insere seus próprios favoritos"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário deleta seus próprios favoritos"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

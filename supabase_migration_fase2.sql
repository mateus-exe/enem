-- =============================================================================
-- MIGRATIONS SUPABASE — Fase 2 (Aprendizado Inteligente)
-- Execute no SQL Editor do Supabase DEPOIS de supabase_migration.sql
-- =============================================================================

-- 1. Tópico da questão nas respostas
ALTER TABLE public.user_answers ADD COLUMN IF NOT EXISTS topic TEXT;
CREATE INDEX IF NOT EXISTS idx_user_answers_topic ON public.user_answers (user_id, topic);

-- 2. Fila de revisão espaçada
CREATE TABLE IF NOT EXISTS public.review_queue (
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_key      TEXT NOT NULL,
  year              INT  NOT NULL,
  "index"           INT  NOT NULL,
  discipline        TEXT NOT NULL,
  topic             TEXT,
  next_review_at    TIMESTAMPTZ NOT NULL,
  interval_days     INT  NOT NULL DEFAULT 1,
  ease_factor       FLOAT NOT NULL DEFAULT 2.5,
  repetitions       INT  NOT NULL DEFAULT 0,
  last_reviewed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, question_key)
);

CREATE INDEX IF NOT EXISTS idx_review_queue_due ON public.review_queue (user_id, next_review_at);

ALTER TABLE public.review_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário lê sua própria fila de revisão"
  ON public.review_queue FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuário insere na sua fila de revisão"
  ON public.review_queue FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuário atualiza sua fila de revisão"
  ON public.review_queue FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuário deleta da sua fila de revisão"
  ON public.review_queue FOR DELETE USING (auth.uid() = user_id);

-- 3. Cache de explicações geradas pela IA (compartilhado entre usuários)
CREATE TABLE IF NOT EXISTS public.question_explanations (
  question_key    TEXT PRIMARY KEY,
  explanation_md  TEXT NOT NULL,
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.question_explanations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários logados leem explicações"
  ON public.question_explanations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários logados salvam explicações"
  ON public.question_explanations FOR INSERT TO authenticated WITH CHECK (true);

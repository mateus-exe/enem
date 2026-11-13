import { supabase } from '@/app/lib/supabase';
import {
  ReviewItem,
  ReviewMeta,
  applyReview,
  createReviewItem,
  isDue,
} from '@/app/lib/srsAlgorithm';

const REVIEW_KEY = 'enem_review_queue_v1';

// ---------------------------------------------------------------------------
// Fila local (localStorage) — funciona sem login
// ---------------------------------------------------------------------------

export function loadReviewQueue(): ReviewItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REVIEW_KEY);
    return raw ? (JSON.parse(raw) as ReviewItem[]) : [];
  } catch {
    return [];
  }
}

function saveReviewQueue(items: ReviewItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(REVIEW_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Erro ao salvar fila de revisão:', e);
  }
}

/** Itens vencidos (prontos para revisar), do mais atrasado ao mais recente. */
export function getDueItems(now: Date = new Date()): ReviewItem[] {
  return loadReviewQueue()
    .filter((item) => isDue(item, now))
    .sort((a, b) => a.nextReviewAt.localeCompare(b.nextReviewAt));
}

/** Atualiza (ou cria) o item da questão após uma resposta e devolve o novo estado. */
export function recordReviewResult(meta: ReviewMeta, isCorrect: boolean): ReviewItem {
  const now = new Date();
  const queue = loadReviewQueue();
  const idx = queue.findIndex((item) => item.questionKey === meta.questionKey);
  const base = idx >= 0 ? queue[idx] : createReviewItem(meta, now);
  const updated = applyReview({ ...base, topic: meta.topic ?? base.topic }, isCorrect, now);

  if (idx >= 0) queue[idx] = updated;
  else queue.push(updated);

  saveReviewQueue(queue);
  return updated;
}

// ---------------------------------------------------------------------------
// Sincronização com o Supabase (tabela review_queue)
// ---------------------------------------------------------------------------

type DbReviewRow = {
  user_id: string;
  question_key: string;
  year: number;
  index: number;
  discipline: string;
  topic: string | null;
  next_review_at: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  last_reviewed_at: string;
};

function toDbRow(item: ReviewItem, userId: string): DbReviewRow {
  return {
    user_id: userId,
    question_key: item.questionKey,
    year: item.year,
    index: item.index,
    discipline: item.discipline,
    topic: item.topic ?? null,
    next_review_at: item.nextReviewAt,
    interval_days: item.intervalDays,
    ease_factor: item.easeFactor,
    repetitions: item.repetitions,
    last_reviewed_at: item.lastReviewedAt,
  };
}

function toItem(row: DbReviewRow): ReviewItem {
  return {
    questionKey: row.question_key,
    year: row.year,
    index: row.index,
    discipline: row.discipline,
    topic: row.topic,
    nextReviewAt: row.next_review_at,
    intervalDays: row.interval_days,
    easeFactor: row.ease_factor,
    repetitions: row.repetitions,
    lastReviewedAt: row.last_reviewed_at,
  };
}

export async function pushRemoteReviewItem(item: ReviewItem, userId: string): Promise<void> {
  const { error } = await supabase
    .from('review_queue')
    .upsert(toDbRow(item, userId), { onConflict: 'user_id,question_key' });
  if (error) console.error('[reviewQueueService] Erro ao salvar revisão:', error.message);
}

/**
 * Mescla a fila remota com a local (vence o item revisado mais recentemente),
 * grava o resultado no localStorage e envia ao servidor o que estiver mais novo localmente.
 */
export async function syncRemoteReviewQueue(userId: string): Promise<ReviewItem[]> {
  const { data, error } = await supabase.from('review_queue').select('*');
  if (error) {
    console.error('[reviewQueueService] Erro ao carregar fila remota:', error.message);
    return loadReviewQueue();
  }

  const merged = new Map<string, ReviewItem>();
  const toUpload: ReviewItem[] = [];

  for (const row of (data as DbReviewRow[]) ?? []) {
    merged.set(row.question_key, toItem(row));
  }

  for (const local of loadReviewQueue()) {
    const remote = merged.get(local.questionKey);
    if (!remote || local.lastReviewedAt > remote.lastReviewedAt) {
      merged.set(local.questionKey, local);
      toUpload.push(local);
    }
  }

  const result = [...merged.values()];
  saveReviewQueue(result);

  if (toUpload.length > 0) {
    const { error: upError } = await supabase
      .from('review_queue')
      .upsert(
        toUpload.map((item) => toDbRow(item, userId)),
        { onConflict: 'user_id,question_key' }
      );
    if (upError) console.error('[reviewQueueService] Erro ao enviar fila local:', upError.message);
  }

  return result;
}

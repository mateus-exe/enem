/**
 * Revisão espaçada baseada no SM-2 simplificado (o mesmo princípio do Anki).
 * - Acertou 1ª vez: revisar em 3 dias
 * - Acertou 2ª vez: revisar em 7 dias
 * - Depois: intervalo × fator de facilidade
 * - Errou: volta para amanhã
 */

export interface ReviewItem {
  questionKey: string;
  year: number;
  index: number;
  discipline: string;
  topic?: string | null;
  nextReviewAt: string;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  lastReviewedAt: string;
}

export interface ReviewMeta {
  questionKey: string;
  year: number;
  index: number;
  discipline: string;
  topic?: string | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const INITIAL_EASE = 2.5;
const MIN_EASE = 1.3;
const MAX_EASE = 3;

export function createReviewItem(meta: ReviewMeta, now: Date): ReviewItem {
  return {
    ...meta,
    nextReviewAt: now.toISOString(),
    intervalDays: 0,
    easeFactor: INITIAL_EASE,
    repetitions: 0,
    lastReviewedAt: now.toISOString(),
  };
}

export function applyReview(item: ReviewItem, isCorrect: boolean, now: Date): ReviewItem {
  let { repetitions, intervalDays, easeFactor } = item;

  if (isCorrect) {
    repetitions += 1;
    if (repetitions === 1) intervalDays = 3;
    else if (repetitions === 2) intervalDays = 7;
    else intervalDays = Math.max(1, Math.round(intervalDays * easeFactor));
    easeFactor = Math.min(MAX_EASE, easeFactor + 0.05);
  } else {
    repetitions = 0;
    intervalDays = 1;
    easeFactor = Math.max(MIN_EASE, easeFactor - 0.2);
  }

  return {
    ...item,
    repetitions,
    intervalDays,
    easeFactor,
    lastReviewedAt: now.toISOString(),
    nextReviewAt: new Date(now.getTime() + intervalDays * DAY_MS).toISOString(),
  };
}

export function isDue(item: ReviewItem, now: Date = new Date()): boolean {
  return new Date(item.nextReviewAt).getTime() <= now.getTime();
}

import { supabase } from '@/app/lib/supabase';
import { UserAnswerRecord, StatsPeriod } from '@/app/types';

// ---------------------------------------------------------------------------
// Helpers de mapeamento: snake_case (DB) <-> camelCase (app)
// ---------------------------------------------------------------------------

type DbAnswerRow = {
  id: string;
  user_id: string;
  session_id: string;
  question_key: string;
  exam_year: number;
  exam_day: number;
  discipline: string;
  topic: string | null;
  selected_letter: string;
  correct_letter: string;
  is_correct: boolean;
  time_spent_seconds: number;
  answered_at: string;
};

function toRecord(row: DbAnswerRow): UserAnswerRecord {
  return {
    id: row.id,
    sessionId: row.session_id,
    questionKey: row.question_key,
    examYear: row.exam_year,
    examDay: row.exam_day as 1 | 2,
    discipline: row.discipline,
    topic: row.topic,
    selectedLetter: row.selected_letter as UserAnswerRecord['selectedLetter'],
    correctLetter: row.correct_letter as UserAnswerRecord['correctLetter'],
    isCorrect: row.is_correct,
    timeSpentSeconds: row.time_spent_seconds,
    answeredAt: row.answered_at,
  };
}

function toDbRow(record: UserAnswerRecord, userId: string): Omit<DbAnswerRow, 'user_id'> & { user_id: string } {
  return {
    id: record.id,
    user_id: userId,
    session_id: record.sessionId,
    question_key: record.questionKey,
    exam_year: record.examYear,
    exam_day: record.examDay,
    discipline: record.discipline,
    topic: record.topic ?? null,
    selected_letter: record.selectedLetter,
    correct_letter: record.correctLetter,
    is_correct: record.isCorrect,
    time_spent_seconds: record.timeSpentSeconds,
    answered_at: record.answeredAt,
  };
}

// ---------------------------------------------------------------------------
// Funções públicas
// ---------------------------------------------------------------------------

/** Carrega todas as respostas do usuário autenticado. */
export async function loadRemoteAnswers(): Promise<UserAnswerRecord[]> {
  const { data, error } = await supabase
    .from('user_answers')
    .select('*')
    .order('answered_at', { ascending: false });

  if (error) {
    console.error('[remoteStorageService] Erro ao carregar respostas:', error.message);
    return [];
  }

  return (data as DbAnswerRow[]).map(toRecord);
}

/** Salva uma resposta no banco. Retorna ok:false em caso de erro. */
export async function saveRemoteAnswer(
  record: UserAnswerRecord,
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from('user_answers')
    .upsert(toDbRow(record, userId), { onConflict: 'id' });

  if (error) {
    console.error('[remoteStorageService] Erro ao salvar resposta:', error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

/** Remove todas as respostas do usuário autenticado (limpa o histórico). */
export async function clearRemoteAnswers(): Promise<void> {
  const { error } = await supabase.from('user_answers').delete().neq('id', '');
  if (error) {
    console.error('[remoteStorageService] Erro ao limpar respostas:', error.message);
  }
}

/** Importa (upsert em lote) um array de respostas — usado na migração do localStorage. */
export async function importRemoteAnswers(
  records: UserAnswerRecord[],
  userId: string
): Promise<{ ok: boolean; count: number }> {
  if (records.length === 0) return { ok: true, count: 0 };

  const rows = records.map((r) => toDbRow(r, userId));

  const { error } = await supabase
    .from('user_answers')
    .upsert(rows, { onConflict: 'id' });

  if (error) {
    console.error('[remoteStorageService] Erro ao importar respostas:', error.message);
    return { ok: false, count: 0 };
  }

  return { ok: true, count: records.length };
}

// ---------------------------------------------------------------------------
// Filtros e cálculos (iguais ao storageService local — reutilizáveis)
// ---------------------------------------------------------------------------

export function filterAnswersByPeriod(
  answers: UserAnswerRecord[],
  period: StatsPeriod
): UserAnswerRecord[] {
  const now = new Date();
  const cutoff = new Date();

  switch (period) {
    case 'day':    cutoff.setHours(0, 0, 0, 0); break;
    case 'week':   cutoff.setDate(now.getDate() - 7); break;
    case 'month':  cutoff.setMonth(now.getMonth() - 1); break;
    case 'quarter':cutoff.setMonth(now.getMonth() - 3); break;
    case 'semester':cutoff.setMonth(now.getMonth() - 6); break;
    case 'year':   cutoff.setFullYear(now.getFullYear() - 1); break;
  }

  return answers.filter((a) => new Date(a.answeredAt) >= cutoff);
}

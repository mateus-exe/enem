import { UserAnswerRecord, StatsPeriod } from '@/app/types';

const STORAGE_KEY = 'enem_answers_v1';

export function loadAnswers(): UserAnswerRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserAnswerRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveAnswer(record: UserAnswerRecord): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = loadAnswers();
    existing.push(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error('Erro ao salvar resposta no localStorage:', e);
  }
}

export function clearAnswers(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function filterAnswersByPeriod(
  answers: UserAnswerRecord[],
  period: StatsPeriod,
  currentSessionId: string | null
): UserAnswerRecord[] {
  if (period === 'session') {
    return answers.filter((a) => a.sessionId === currentSessionId);
  }

  const now = new Date();
  const cutoffDate = new Date();

  switch (period) {
    case 'day':
      cutoffDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      cutoffDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      cutoffDate.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      cutoffDate.setMonth(now.getMonth() - 3);
      break;
    case 'semester':
      cutoffDate.setMonth(now.getMonth() - 6);
      break;
    case 'year':
      cutoffDate.setFullYear(now.getFullYear() - 1);
      break;
  }

  return answers.filter((a) => new Date(a.answeredAt) >= cutoffDate);
}

export function computeStats(answers: UserAnswerRecord[]) {
  const total = answers.length;
  const correct = answers.filter((a) => a.isCorrect).length;
  const wrong = total - correct;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const avgTime =
    total > 0
      ? Math.round(answers.reduce((s, a) => s + a.timeSpentSeconds, 0) / total)
      : 0;

  const byDiscipline: Record<string, { total: number; correct: number }> = {};
  for (const a of answers) {
    if (!byDiscipline[a.discipline]) {
      byDiscipline[a.discipline] = { total: 0, correct: 0 };
    }
    byDiscipline[a.discipline].total++;
    if (a.isCorrect) byDiscipline[a.discipline].correct++;
  }

  return { total, correct, wrong, accuracy, avgTime, byDiscipline };
}

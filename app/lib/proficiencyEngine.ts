export type ProficiencyLevel = 'Iniciante' | 'Intermediário' | 'Avançado' | 'Expert';

/** Meta de questões por área para considerar o volume de prática "completo". */
export const QUESTIONS_GOAL_PER_AREA = 200;

export interface Proficiency {
  score: number; // 0-100
  level: ProficiencyLevel;
}

/** proficiência = (taxa_acerto × 0.6) + (questões_respondidas / meta × 0.4) */
export function computeProficiency(total: number, correct: number): Proficiency {
  if (total === 0) return { score: 0, level: 'Iniciante' };

  const accuracy = (correct / total) * 100;
  const volume = Math.min(total / QUESTIONS_GOAL_PER_AREA, 1) * 100;
  const score = Math.round(accuracy * 0.6 + volume * 0.4);

  let level: ProficiencyLevel = 'Iniciante';
  if (score >= 75) level = 'Expert';
  else if (score >= 50) level = 'Avançado';
  else if (score >= 25) level = 'Intermediário';

  return { score, level };
}

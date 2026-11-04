export interface Alternative {
  letter: 'A' | 'B' | 'C' | 'D' | 'E';
  text: string;
  file: string | null;
  isCorrect: boolean;
}

export interface Question {
  title: string;
  index: number;
  year: number;
  discipline: 'ciencias-humanas' | 'linguagens' | 'ciencias-natureza' | 'matematica';
  language?: string | null;
  context: string | null;
  files: string[];
  alternativesIntroduction: string | null;
  alternatives: Alternative[];
}

export interface Exam {
  year: number;
  languages: string[];
  tests: Array<{
    title: string;
    discipline: string;
    questions: number;
  }>;
}

export interface UserAnswerRecord {
  id: string;
  sessionId: string;
  questionKey: string;
  examYear: number;
  examDay: 1 | 2;
  discipline: string;
  selectedLetter: 'A' | 'B' | 'C' | 'D' | 'E';
  correctLetter: 'A' | 'B' | 'C' | 'D' | 'E';
  isCorrect: boolean;
  timeSpentSeconds: number;
  answeredAt: string;
}

export type StatsPeriod =
  | 'session'
  | 'day'
  | 'week'
  | 'month'
  | 'quarter'
  | 'semester'
  | 'year';

export type DisciplineFilter =
  | 'all'
  | 'ciencias-humanas'
  | 'linguagens'
  | 'ciencias-natureza'
  | 'matematica';

export type DayFilter = 'all' | 1 | 2;

export interface StudySession {
  sessionId: string;
  examYear: number | 'random';
  dayFilter: DayFilter;
  disciplineFilter: DisciplineFilter;
  questions: Question[];
  currentIndex: number;
  startedAt: string;
}

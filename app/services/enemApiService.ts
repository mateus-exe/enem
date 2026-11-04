import { Exam, Question, DisciplineFilter, DayFilter } from '@/app/types';

const BASE_URL = 'https://api.enem.dev/v1';

// Cache em memória para evitar requisições repetidas durante a sessão
const memCache = new Map<string, unknown>();

async function fetchWithCache<T>(url: string): Promise<T> {
  if (memCache.has(url)) {
    return memCache.get(url) as T;
  }
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} — ${url}`);
  }
  const data = await res.json();
  memCache.set(url, data);
  return data as T;
}

export async function fetchExams(): Promise<Exam[]> {
  return fetchWithCache<Exam[]>(`${BASE_URL}/exams`);
}

export async function fetchAllQuestionsForYear(year: number): Promise<Question[]> {
  const all: Question[] = [];
  let offset = 0;
  const limit = 50;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const url = `${BASE_URL}/exams/${year}/questions?limit=${limit}&offset=${offset}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await fetchWithCache<any>(url);

    // A API pode retornar { questions: [...] } ou diretamente o array
    const batch: Question[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.questions)
      ? data.questions
      : [];

    if (batch.length === 0) break;
    all.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }

  return all;
}

export async function fetchQuestionsFiltered(
  year: number,
  dayFilter: DayFilter,
  disciplineFilter: DisciplineFilter
): Promise<Question[]> {
  const all = await fetchAllQuestionsForYear(year);

  let result = all;

  if (dayFilter === 1) {
    result = result.filter(
      (q) => q.discipline === 'linguagens' || q.discipline === 'ciencias-humanas'
    );
  } else if (dayFilter === 2) {
    result = result.filter(
      (q) => q.discipline === 'ciencias-natureza' || q.discipline === 'matematica'
    );
  }

  if (disciplineFilter !== 'all') {
    result = result.filter((q) => q.discipline === disciplineFilter);
  }

  return result;
}

export async function fetchRandomYearQuestions(
  dayFilter: DayFilter,
  disciplineFilter: DisciplineFilter
): Promise<Question[]> {
  const exams = await fetchExams();
  const years = exams.map((e) => e.year);
  const randomYear = years[Math.floor(Math.random() * years.length)];
  return fetchQuestionsFiltered(randomYear, dayFilter, disciplineFilter);
}

export const disciplineLabel: Record<string, string> = {
  'ciencias-humanas': 'Ciências Humanas',
  linguagens: 'Linguagens',
  'ciencias-natureza': 'Ciências da Natureza',
  matematica: 'Matemática',
};

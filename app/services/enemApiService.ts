import { Exam, Question, DisciplineFilter, DayFilter, LanguageFilter } from '@/app/types';

const BASE_URL = 'https://api.enem.dev/v1';

// ---------------------------------------------------------------------------
// Cache em memória com TTL (Time-to-Live) de 1 hora
// ---------------------------------------------------------------------------
const CACHE_TTL_MS = 3600 * 1000; // 1 hora

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const memCache = new Map<string, CacheEntry>();

/** Limpa todo o cache em memória manualmente. */
export function clearApiCache(): void {
  memCache.clear();
}

// ---------------------------------------------------------------------------
// Helpers: timeout, retry com backoff exponencial
// ---------------------------------------------------------------------------
const FETCH_TIMEOUT_MS = 10_000; // 10 segundos
const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 1000; // 1s, 2s, 4s

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string): Promise<Response> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      // Se receber 429 (rate-limit), respeitar Retry-After e tentar novamente
      if (res.status === 429) {
        const retryAfterHeader = res.headers.get('Retry-After');
        const retryAfterMs = retryAfterHeader
          ? Number(retryAfterHeader) * 1000
          : BACKOFF_BASE_MS * Math.pow(2, attempt);
        if (attempt < MAX_RETRIES - 1) {
          await sleep(retryAfterMs);
          continue;
        }
      }

      if (!res.ok) {
        // Para outros erros de servidor (5xx), tentar novamente com backoff
        if (res.status >= 500 && attempt < MAX_RETRIES - 1) {
          await sleep(BACKOFF_BASE_MS * Math.pow(2, attempt));
          continue;
        }
        throw new Error(`API error: ${res.status} — ${url}`);
      }

      return res;
    } catch (error: unknown) {
      clearTimeout(timeoutId);

      // Timeout do AbortController
      if (error instanceof DOMException && error.name === 'AbortError') {
        if (attempt < MAX_RETRIES - 1) {
          await sleep(BACKOFF_BASE_MS * Math.pow(2, attempt));
          continue;
        }
        throw new Error(`Timeout de ${FETCH_TIMEOUT_MS / 1000}s atingido ao buscar: ${url}`);
      }

      // Erro de rede ou outro erro inesperado
      if (attempt < MAX_RETRIES - 1) {
        await sleep(BACKOFF_BASE_MS * Math.pow(2, attempt));
        continue;
      }
      throw error;
    }
  }

  // Fallback — nunca deveria chegar aqui
  throw new Error(`Falha após ${MAX_RETRIES} tentativas: ${url}`);
}

// ---------------------------------------------------------------------------
// Fetch com cache + TTL + retry
// ---------------------------------------------------------------------------
async function fetchWithCache<T>(url: string): Promise<T> {
  const cached = memCache.get(url);

  if (cached) {
    const age = Date.now() - cached.timestamp;
    if (age < CACHE_TTL_MS) {
      return cached.data as T;
    }
    // Expirou — remover entrada obsoleta
    memCache.delete(url);
  }

  const res = await fetchWithRetry(url);
  const data = await res.json();

  memCache.set(url, { data, timestamp: Date.now() });
  return data as T;
}

// ---------------------------------------------------------------------------
// Funções públicas da API
// ---------------------------------------------------------------------------

export async function fetchExams(): Promise<Exam[]> {
  return fetchWithCache<Exam[]>(`${BASE_URL}/exams`);
}

const MAX_PAGINATION_ITERATIONS = 10;

export async function fetchAllQuestionsForYear(year: number): Promise<Question[]> {
  const all: Question[] = [];
  let offset = 0;
  const limit = 50;
  let iterations = 0;

  while (iterations < MAX_PAGINATION_ITERATIONS) {
    iterations++;
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
  disciplineFilter: DisciplineFilter,
  languageFilter: LanguageFilter = 'ingles'
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

  // Filtra língua estrangeira: mantém questões sem language (PT, Literatura...)
  // e questões da língua escolhida (ingles ou espanhol)
  const includesLinguagens =
    disciplineFilter === 'all' ||
    disciplineFilter === 'linguagens' ||
    dayFilter === 1;

  if (includesLinguagens) {
    result = result.filter(
      (q) =>
        !q.language ||
        q.language.toLowerCase() === languageFilter.toLowerCase()
    );
  }

  return result;
}

export async function fetchRandomYearQuestions(
  dayFilter: DayFilter,
  disciplineFilter: DisciplineFilter,
  languageFilter: LanguageFilter = 'ingles'
): Promise<Question[]> {
  const exams = await fetchExams();
  const years = exams.map((e) => e.year);
  const randomYear = years[Math.floor(Math.random() * years.length)];
  return fetchQuestionsFiltered(randomYear, dayFilter, disciplineFilter, languageFilter);
}

export const disciplineLabel: Record<string, string> = {
  'ciencias-humanas': 'Ciências Humanas',
  linguagens: 'Linguagens',
  'ciencias-natureza': 'Ciências da Natureza',
  matematica: 'Matemática',
};

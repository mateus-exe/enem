'use client';
import { useState, useEffect } from 'react';
import {
  ChevronDown,
  BookOpen,
  FlaskConical,
  Calculator,
  Languages,
  Globe,
} from 'lucide-react';
import { fetchExams } from '@/app/services/enemApiService';
import { DayFilter, DisciplineFilter, LanguageFilter } from '@/app/types';

interface Props {
  onStart: (
    year: number | 'random',
    day: DayFilter,
    discipline: DisciplineFilter,
    language: LanguageFilter
  ) => void;
  loading: boolean;
  error: string | null;
}

const disciplineOptions: {
  value: DisciplineFilter;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: 'all', label: 'Todas as áreas', icon: Globe },
  { value: 'ciencias-humanas', label: 'Ciências Humanas', icon: BookOpen },
  { value: 'linguagens', label: 'Linguagens', icon: Languages },
  { value: 'ciencias-natureza', label: 'Ciências da Natureza', icon: FlaskConical },
  { value: 'matematica', label: 'Matemática', icon: Calculator },
];

const dayOptions: { value: DayFilter; label: string; sub: string }[] = [
  { value: 'all', label: 'Ambos os dias', sub: '' },
  { value: 1, label: '1º Dia', sub: 'Humanas e Linguagens' },
  { value: 2, label: '2º Dia', sub: 'Natureza e Matemática' },
];

const languageOptions: { value: LanguageFilter; label: string; sub: string }[] = [
  { value: 'ingles', label: 'Inglês', sub: 'Língua estrangeira' },
  { value: 'espanhol', label: 'Espanhol', sub: 'Língua estrangeira' },
];

/** Retorna true se a seleção atual inclui questões de Linguagens */
function includesLinguagens(day: DayFilter, discipline: DisciplineFilter): boolean {
  if (discipline === 'linguagens') return true;
  if (discipline === 'all') return true;
  if (day === 1) return true;
  return false;
}

export default function PracticeMenu({ onStart, loading, error }: Props) {
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | 'random'>('random');
  const [dayFilter, setDayFilter] = useState<DayFilter>('all');
  const [disciplineFilter, setDisciplineFilter] = useState<DisciplineFilter>('all');
  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>('ingles');

  const showLanguageSelector = includesLinguagens(dayFilter, disciplineFilter);

  useEffect(() => {
    fetchExams()
      .then((exams) => {
        const years = exams.map((e) => e.year).sort((a, b) => b - a);
        setAvailableYears(years);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-text-main mb-1">Praticar</h1>
        <p className="text-sm text-text-meta">
          Escolha o ano e o modo de estudo para iniciar uma sessão.
        </p>
      </div>

      {/* Seletor de Ano */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-text-meta uppercase tracking-widest">
          Ano da Prova
        </label>
        <div className="relative">
          <select
            value={selectedYear}
            onChange={(e) =>
              setSelectedYear(
                e.target.value === 'random' ? 'random' : Number(e.target.value)
              )
            }
            className="w-full appearance-none bg-white border border-border-soft rounded-lg px-4 py-3 text-sm text-text-main pr-10 focus:outline-none focus:ring-2 focus:ring-action-main focus:border-transparent cursor-pointer"
          >
            <option value="random">Anos Aleatórios</option>
            {availableYears.map((y) => (
              <option key={y} value={y}>
                ENEM {y}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            strokeWidth={1.5}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-meta pointer-events-none"
          />
        </div>
      </div>

      {/* Seletor de Dia */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-text-meta uppercase tracking-widest">
          Dia da Prova
        </label>
        <div className="grid grid-cols-3 gap-2">
          {dayOptions.map(({ value, label, sub }) => (
            <button
              key={String(value)}
              onClick={() => setDayFilter(value)}
              className={`px-3 py-3 rounded-lg border text-sm font-medium text-left transition-colors ${
                dayFilter === value
                  ? 'border-action-main bg-action-main text-white'
                  : 'border-border-soft bg-white text-text-main hover:border-action-main'
              }`}
            >
              <div>{label}</div>
              {sub && (
                <div
                  className={`text-xs mt-0.5 ${
                    dayFilter === value ? 'text-white/70' : 'text-text-meta'
                  }`}
                >
                  {sub}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Seletor de Disciplina */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-text-meta uppercase tracking-widest">
          Área / Disciplina
        </label>
        <div className="grid grid-cols-1 gap-2">
          {disciplineOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setDisciplineFilter(value)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                disciplineFilter === value
                  ? 'border-action-main bg-action-main text-white'
                  : 'border-border-soft bg-white text-text-main hover:border-action-main'
              }`}
            >
              <Icon size={16} strokeWidth={1.5} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Seletor de Língua Estrangeira — aparece quando Linguagens está incluída */}
      {showLanguageSelector && (
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-text-meta uppercase tracking-widest">
            Língua Estrangeira
          </label>
          <p className="text-xs text-text-meta -mt-1">
            Escolha o idioma das questões de língua estrangeira da prova.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {languageOptions.map(({ value, label, sub }) => (
              <button
                key={value}
                onClick={() => setLanguageFilter(value)}
                className={`px-4 py-3 rounded-lg border text-sm font-medium text-left transition-colors ${
                  languageFilter === value
                    ? 'border-action-main bg-action-main text-white'
                    : 'border-border-soft bg-white text-text-main hover:border-action-main'
                }`}
              >
                <div>{label}</div>
                <div
                  className={`text-xs mt-0.5 ${
                    languageFilter === value ? 'text-white/70' : 'text-text-meta'
                  }`}
                >
                  {sub}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-wrong-bg border border-wrong-border text-wrong-text rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={() => onStart(selectedYear, dayFilter, disciplineFilter, languageFilter)}
        disabled={loading}
        className="w-full bg-action-main text-white py-3.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Carregando questões...' : 'Iniciar Sessão'}
      </button>
    </div>
  );
}

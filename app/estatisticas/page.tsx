'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  loadAnswers,
  filterAnswersByPeriod,
  computeStats,
} from '@/app/services/storageService';
import { UserAnswerRecord, StatsPeriod, DisciplineFilter } from '@/app/types';
import MetricCard from '@/app/components/MetricCard';
import DataManager from '@/app/components/DataManager';
import { disciplineLabel } from '@/app/services/enemApiService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

const PERIOD_LABELS: Record<StatsPeriod, string> = {
  day: 'Dia',
  week: 'Semana',
  month: 'Mês',
  quarter: 'Trimestre',
  semester: 'Semestre',
  year: 'Ano',
};

const PERIODS: StatsPeriod[] = [
  'day',
  'week',
  'month',
  'quarter',
  'semester',
  'year',
];

const DISCIPLINE_OPTIONS: { value: DisciplineFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'ciencias-humanas', label: 'C. Humanas' },
  { value: 'linguagens', label: 'Linguagens' },
  { value: 'ciencias-natureza', label: 'C. Natureza' },
  { value: 'matematica', label: 'Matemática' },
];

export default function EstatisticasPage() {
  const [period, setPeriod] = useState<StatsPeriod>('week');
  const [answers, setAnswers] = useState<UserAnswerRecord[]>([]);
  const [disciplineFilter, setDisciplineFilter] = useState<DisciplineFilter>('all');

  const refreshAnswers = useCallback(() => {
    setAnswers(loadAnswers());
  }, []);

  useEffect(() => {
    // Lê o snapshot do armazenamento local ao montar a página.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshAnswers();
  }, [refreshAnswers]);

  const filtered = useMemo(() => {
    const periodAnswers = filterAnswersByPeriod(answers, period);
    return disciplineFilter === 'all'
      ? periodAnswers
      : periodAnswers.filter((answer) => answer.discipline === disciplineFilter);
  }, [answers, period, disciplineFilter]);

  const stats = useMemo(() => computeStats(filtered), [filtered]);

  const disciplineData = useMemo(
    () =>
      Object.entries(stats.byDiscipline).map(([disc, data]) => ({
        name: disciplineLabel[disc] ?? disc,
        taxa: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
        total: data.total,
      })),
    [stats.byDiscipline]
  );

  const historyData = useMemo(() => {
    const historyMap: Record<string, { total: number; correct: number }> = {};
    for (const a of filtered) {
      const day = a.answeredAt.slice(0, 10);
      if (!historyMap[day]) historyMap[day] = { total: 0, correct: 0 };
      historyMap[day].total++;
      if (a.isCorrect) historyMap[day].correct++;
    }
    return Object.entries(historyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date: date.slice(5), // MM-DD
        questoes: data.total,
        taxa: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      }));
  }, [filtered]);

  const formatAvgTime = (secs: number) => {
    if (secs < 60) return `${secs}s`;
    return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-main mb-1">Estatísticas</h1>
          <p className="text-sm text-text-meta">Acompanhe sua evolução por período.</p>
        </div>
        <DataManager onImportComplete={refreshAnswers} />
      </div>

      {/* Filtros de Período */}
      <div className="flex flex-wrap gap-2" aria-label="Filtrar por período">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            aria-pressed={period === p}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              period === p
                ? 'bg-action-main text-action-contrast'
                : 'bg-bg-secondary text-text-meta hover:text-text-main border border-border-soft'
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Filtro de Disciplina */}
      <div className="flex flex-wrap gap-2" aria-label="Filtrar por disciplina">
        {DISCIPLINE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setDisciplineFilter(option.value)}
            aria-pressed={disciplineFilter === option.value}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${disciplineFilter === option.value ? 'bg-action-main text-action-contrast' : 'bg-bg-secondary text-text-meta hover:text-text-main border border-border-soft'}`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* 4 Cards de métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Respondidas" value={stats.total} />
        <MetricCard label="Taxa de Acerto" value={`${stats.accuracy}%`} />
        <MetricCard
          label="Acertos / Erros"
          value={`${stats.correct} / ${stats.wrong}`}
        />
        <MetricCard
          label="Tempo Médio"
          value={formatAvgTime(stats.avgTime)}
          sub="por questão"
        />
      </div>

      {/* Gráfico: Desempenho por Área */}
      {disciplineData.length > 0 && (
        <div className="bg-bg-primary border border-border-soft rounded-xl p-6">
          <h2 className="text-sm font-semibold text-text-main mb-6">
            Desempenho por Área (Taxa de Acerto %)
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart layout="vertical" data={disciplineData} margin={{ left: 10 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke='var(--color-border-soft)'
                horizontal={false}
              />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: 'var(--color-text-meta)' }}
                tickLine={false}
                axisLine={false}
                unit="%"
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 11, fill: 'var(--color-text-meta)' }}
                tickLine={false}
                axisLine={false}
                width={130}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload as { name: string; taxa: number; total: number };
                  return (
                    <div style={{ fontSize: 12, border: '1px solid var(--color-border-soft)', background: 'var(--color-bg-primary)', color: 'var(--color-text-main)', borderRadius: 8, padding: '8px 12px' }}>
                      <p style={{ fontWeight: 600, marginBottom: 4 }}>{item.name}</p>
                      <p>Taxa de acerto: <strong>{item.taxa}%</strong></p>
                      <p style={{ color: 'var(--color-text-meta)' }}>Total respondidas: {item.total}</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="taxa" fill='var(--color-action-main)' radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Gráfico: Histórico de Evolução */}
      {historyData.length > 0 && (
        <div className="bg-bg-primary border border-border-soft rounded-xl p-6">
          <h2 className="text-sm font-semibold text-text-main mb-6">
            Histórico de Evolução
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" stroke='var(--color-border-soft)' />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'var(--color-text-meta)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: 'var(--color-text-meta)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                unit="%"
                tick={{ fontSize: 11, fill: 'var(--color-text-meta)' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  border: '1px solid var(--color-border-soft)',
                  background: 'var(--color-bg-primary)',
                  color: 'var(--color-text-main)',
                  borderRadius: 8,
                }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="questoes"
                stroke='var(--color-text-meta)'
                strokeWidth={1.5}
                dot={false}
                name="Questões"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="taxa"
                stroke='var(--color-action-main)'
                strokeWidth={2}
                dot={false}
                name="Taxa de Acerto %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Estado vazio */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-text-meta text-sm">
          Nenhuma resposta registrada no período selecionado.
          <br />
          Acesse a aba{' '}
          <strong className="text-text-main font-semibold">Praticar</strong> para
          iniciar uma sessão.
        </div>
      )}
    </div>
  );
}

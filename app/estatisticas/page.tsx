'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  loadAnswers,
  filterAnswersByPeriod,
  computeStats,
} from '@/app/services/storageService';
import { UserAnswerRecord, StatsPeriod } from '@/app/types';
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
  session: 'Sessão Atual',
  day: 'Dia',
  week: 'Semana',
  month: 'Mês',
  quarter: 'Trimestre',
  semester: 'Semestre',
  year: 'Ano',
};

const PERIODS: StatsPeriod[] = [
  'session',
  'day',
  'week',
  'month',
  'quarter',
  'semester',
  'year',
];

export default function EstatisticasPage() {
  const [period, setPeriod] = useState<StatsPeriod>('week');
  const [answers, setAnswers] = useState<UserAnswerRecord[]>([]);

  const refreshAnswers = useCallback(() => {
    setAnswers(loadAnswers());
  }, []);

  useEffect(() => {
    refreshAnswers();
  }, [refreshAnswers]);

  const filtered = useMemo(
    () => filterAnswersByPeriod(answers, period, null),
    [answers, period]
  );

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
      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              period === p
                ? 'bg-action-main text-white'
                : 'bg-bg-secondary text-text-meta hover:text-text-main border border-border-soft'
            }`}
          >
            {PERIOD_LABELS[p]}
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
                stroke="#E2E8F0"
                horizontal={false}
              />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: '#64748B' }}
                tickLine={false}
                axisLine={false}
                unit="%"
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 11, fill: '#64748B' }}
                tickLine={false}
                axisLine={false}
                width={130}
              />
              <Tooltip
                formatter={(v) => [`${Number(v)}%`, 'Taxa de Acerto']}
                contentStyle={{
                  fontSize: 12,
                  border: '1px solid #E2E8F0',
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="taxa" fill="#1E293B" radius={[0, 4, 4, 0]} />
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
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#64748B' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: '#64748B' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                unit="%"
                tick={{ fontSize: 11, fill: '#64748B' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  border: '1px solid #E2E8F0',
                  borderRadius: 8,
                }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="questoes"
                stroke="#64748B"
                strokeWidth={1.5}
                dot={false}
                name="Questões"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="taxa"
                stroke="#1E293B"
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

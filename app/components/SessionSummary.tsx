'use client';

import Link from 'next/link';
import { BarChart2, CheckCircle, Clock, XCircle } from 'lucide-react';
import { UserAnswerRecord } from '@/app/types';
import { computeStats } from '@/app/services/storageService';
import { disciplineLabel } from '@/app/services/enemApiService';

interface Props {
  records: UserAnswerRecord[];
  examYear: number | 'random';
  disciplineFilter: string;
  onNewSession: () => void;
}

export default function SessionSummary({ records, examYear, disciplineFilter, onNewSession }: Props) {
  const stats = computeStats(records);
  const avgTime = stats.avgTime < 60
    ? `${stats.avgTime}s`
    : `${Math.floor(stats.avgTime / 60)}m ${stats.avgTime % 60}s`;
  const yearLabel = examYear === 'random' ? 'Questões aleatórias' : `ENEM ${examYear}`;
  const areaLabel = disciplineFilter === 'all' ? 'Todas as áreas' : disciplineLabel[disciplineFilter] ?? disciplineFilter;

  return (
    <section className="max-w-2xl mx-auto px-6 py-12 space-y-8" aria-labelledby="session-summary-title">
      <header>
        <h1 id="session-summary-title" className="text-2xl font-semibold text-text-main mb-1">Sessão concluída</h1>
        <p className="text-sm text-text-meta">{yearLabel} · {areaLabel}</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <Metric label="Respondidas" value={stats.total} />
        <Metric label="Taxa de acerto" value={`${stats.accuracy}%`} />
        <div className="bg-correct-bg border border-correct-border rounded-xl px-5 py-4 flex items-center gap-3">
          <CheckCircle size={20} className="text-correct-text" strokeWidth={1.5} />
          <div><p className="text-xs text-correct-text font-medium">Acertos</p><p className="text-xl font-bold text-correct-text">{stats.correct}</p></div>
        </div>
        <div className="bg-wrong-bg border border-wrong-border rounded-xl px-5 py-4 flex items-center gap-3">
          <XCircle size={20} className="text-wrong-text" strokeWidth={1.5} />
          <div><p className="text-xs text-wrong-text font-medium">Erros</p><p className="text-xl font-bold text-wrong-text">{stats.wrong}</p></div>
        </div>
      </div>

      <div className="bg-bg-primary border border-border-soft rounded-xl px-5 py-4 flex items-center gap-3">
        <Clock size={18} className="text-text-meta" strokeWidth={1.5} />
        <div><p className="text-xs text-text-meta font-medium uppercase tracking-widest">Tempo médio por questão</p><p className="text-lg font-semibold text-text-main">{avgTime}</p></div>
      </div>

      {Object.keys(stats.byDiscipline).length > 0 && (
        <div className="bg-bg-primary border border-border-soft rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2"><BarChart2 size={15} className="text-text-meta" /><h2 className="text-xs font-semibold text-text-meta uppercase tracking-widest">Por área</h2></div>
          {Object.entries(stats.byDiscipline).map(([discipline, data]) => {
            const accuracy = Math.round((data.correct / data.total) * 100);
            return <div key={discipline} className="space-y-1">
              <div className="flex justify-between text-xs text-text-meta"><span>{disciplineLabel[discipline] ?? discipline}</span><span>{accuracy}% ({data.correct}/{data.total})</span></div>
              <div className="w-full bg-bg-secondary rounded-full h-1.5"><div className="h-full bg-action-main rounded-full" style={{ width: `${accuracy}%` }} /></div>
            </div>;
          })}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={onNewSession} className="flex-1 bg-action-main text-action-contrast py-3 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">Nova sessão</button>
        <Link href="/estatisticas" className="flex-1 text-center border border-border-soft bg-bg-primary text-text-main py-3 rounded-lg text-sm font-semibold hover:border-action-main transition-colors">Ver estatísticas</Link>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="bg-bg-primary border border-border-soft rounded-xl px-5 py-4 space-y-1"><p className="text-xs text-text-meta font-medium uppercase tracking-widest">{label}</p><p className="text-2xl font-bold text-text-main tabular-nums">{value}</p></div>;
}

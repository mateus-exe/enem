import { useMemo } from 'react';
import { UserAnswerRecord } from '@/app/types';

const WEEKS = 16;
const DAY_MS = 24 * 60 * 60 * 1000;

function dayKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

function intensity(count: number): number {
  if (count === 0) return 0;
  if (count < 5) return 0.3;
  if (count < 15) return 0.55;
  if (count < 30) return 0.8;
  return 1;
}

interface Props {
  answers: UserAnswerRecord[];
}

export default function StudyHeatmap({ answers }: Props) {
  const { cells, activeDays } = useMemo(() => {
    const counts = new Map<string, number>();
    for (const answer of answers) {
      const key = dayKey(new Date(answer.answeredAt));
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Alinha o início na semana (domingo) para a grade ficar em colunas completas
    const start = new Date(today.getTime() - ((WEEKS - 1) * 7 + today.getDay()) * DAY_MS);

    const list: { key: string; count: number; future: boolean }[] = [];
    let active = 0;
    for (let i = 0; i < WEEKS * 7; i++) {
      const date = new Date(start.getTime() + i * DAY_MS);
      const key = dayKey(date);
      const count = counts.get(key) ?? 0;
      if (count > 0) active++;
      list.push({ key, count, future: date.getTime() > today.getTime() });
    }
    return { cells: list, activeDays: active };
  }, [answers]);

  return (
    <div className="bg-bg-primary border border-border-soft rounded-xl p-6">
      <div className="flex items-baseline justify-between mb-5">
        <h2 className="text-sm font-semibold text-text-main">Constância de Estudo</h2>
        <span className="text-xs text-text-meta">
          {activeDays} {activeDays === 1 ? 'dia' : 'dias'} praticados nas últimas {WEEKS} semanas
        </span>
      </div>

      <div className="overflow-x-auto">
        <div
          className="grid grid-rows-7 grid-flow-col gap-1 w-max"
          role="img"
          aria-label={`Mapa de calor: ${activeDays} dias praticados nas últimas ${WEEKS} semanas`}
        >
          {cells.map((cell) => (
            <div
              key={cell.key}
              title={cell.future ? undefined : `${cell.key}: ${cell.count} questões`}
              className="w-3.5 h-3.5 rounded-sm border border-border-soft"
              style={{
                backgroundColor:
                  cell.count > 0 ? 'var(--color-action-main)' : 'var(--color-bg-secondary)',
                opacity: cell.future ? 0 : cell.count > 0 ? intensity(cell.count) : 1,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

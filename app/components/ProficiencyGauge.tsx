import { computeProficiency, QUESTIONS_GOAL_PER_AREA } from '@/app/lib/proficiencyEngine';
import { disciplineLabel } from '@/app/services/enemApiService';

const AREAS = ['linguagens', 'ciencias-humanas', 'ciencias-natureza', 'matematica'] as const;

interface Props {
  byDiscipline: Record<string, { total: number; correct: number }>;
}

export default function ProficiencyGauge({ byDiscipline }: Props) {
  return (
    <div className="bg-bg-primary border border-border-soft rounded-xl p-6">
      <h2 className="text-sm font-semibold text-text-main mb-1">Nível de Proficiência</h2>
      <p className="text-xs text-text-meta mb-5">
        Combina taxa de acerto (60%) e volume de prática, com meta de {QUESTIONS_GOAL_PER_AREA} questões por área (40%).
      </p>

      <ul className="space-y-4">
        {AREAS.map((area) => {
          const data = byDiscipline[area] ?? { total: 0, correct: 0 };
          const { score, level } = computeProficiency(data.total, data.correct);
          return (
            <li key={area}>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-sm text-text-main">{disciplineLabel[area]}</span>
                <span className="text-xs text-text-meta tabular-nums">
                  {level} · {score}/100
                </span>
              </div>
              <div
                className="h-2 rounded-full bg-bg-secondary overflow-hidden"
                role="progressbar"
                aria-valuenow={score}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Proficiência em ${disciplineLabel[area]}`}
              >
                <div
                  className="h-full rounded-full bg-action-main transition-all"
                  style={{ width: `${score}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

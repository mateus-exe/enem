import { UserAnswerRecord } from '@/app/types';

const MIN_ANSWERS_PER_TOPIC = 2;
const MAX_ROWS = 10;

interface TopicRow {
  topic: string;
  total: number;
  correct: number;
  errorRate: number;
}

interface Props {
  answers: UserAnswerRecord[];
}

export default function WeaknessTable({ answers }: Props) {
  const byTopic = new Map<string, { total: number; correct: number }>();
  for (const answer of answers) {
    if (!answer.topic) continue;
    const entry = byTopic.get(answer.topic) ?? { total: 0, correct: 0 };
    entry.total++;
    if (answer.isCorrect) entry.correct++;
    byTopic.set(answer.topic, entry);
  }

  const rows: TopicRow[] = [...byTopic.entries()]
    .filter(([, data]) => data.total >= MIN_ANSWERS_PER_TOPIC)
    .map(([topic, data]) => ({
      topic,
      total: data.total,
      correct: data.correct,
      errorRate: Math.round(((data.total - data.correct) / data.total) * 100),
    }))
    .sort((a, b) => b.errorRate - a.errorRate || b.total - a.total)
    .slice(0, MAX_ROWS);

  return (
    <div className="bg-bg-primary border border-border-soft rounded-xl p-6">
      <h2 className="text-sm font-semibold text-text-main mb-1">Pontos Fracos por Tópico</h2>
      <p className="text-xs text-text-meta mb-5">
        Tópicos com maior taxa de erro (mínimo de {MIN_ANSWERS_PER_TOPIC} respostas). Priorize estes nos estudos.
      </p>

      {rows.length === 0 ? (
        <p className="text-sm text-text-meta">
          Responda mais questões para identificarmos seus pontos fracos. Respostas antigas, anteriores a esta
          função, não têm tópico registrado.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.topic}>
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <span className="text-sm text-text-main truncate">{row.topic}</span>
                <span className="text-xs text-text-meta tabular-nums shrink-0">
                  {row.total - row.correct} erros em {row.total} · {row.errorRate}%
                </span>
              </div>
              <div
                className="h-1.5 rounded-full bg-bg-secondary overflow-hidden"
                role="progressbar"
                aria-valuenow={row.errorRate}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Taxa de erro em ${row.topic}`}
              >
                <div
                  className="h-full rounded-full bg-wrong-text"
                  style={{ width: `${row.errorRate}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

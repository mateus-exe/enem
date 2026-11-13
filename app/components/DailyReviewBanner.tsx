'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RotateCcw } from 'lucide-react';
import { getDueItems } from '@/app/services/reviewQueueService';

export default function DailyReviewBanner() {
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    // Lê o snapshot da fila de revisão no localStorage ao montar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDueCount(getDueItems().length);
  }, []);

  if (dueCount === 0) return null;

  return (
    <div className="max-w-reading mx-auto px-6 pt-8">
      <Link
        href="/revisao"
        className="flex items-center justify-between gap-4 rounded-xl border border-border-soft bg-bg-primary px-4 py-3 hover:bg-bg-secondary transition-colors"
      >
        <span className="flex items-center gap-2.5 text-sm text-text-main">
          <RotateCcw size={16} strokeWidth={1.5} className="text-text-meta" />
          <span>
            <strong className="font-semibold">{dueCount}</strong>{' '}
            {dueCount === 1 ? 'questão para revisar hoje' : 'questões para revisar hoje'}
          </span>
        </span>
        <span className="text-xs font-medium text-text-meta">Revisar agora →</span>
      </Link>
    </div>
  );
}

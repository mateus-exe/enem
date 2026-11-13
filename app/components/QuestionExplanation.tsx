'use client';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/app/lib/authContext';

interface Props {
  year: number;
  index: number;
}

type Status = 'idle' | 'loading' | 'done' | 'error';

export default function QuestionExplanation({ year, index }: Props) {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>('idle');
  const [explanation, setExplanation] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleExplain = async () => {
    setStatus('loading');
    setErrorMessage('');
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, index }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error ?? 'Não foi possível gerar a explicação.');
        setStatus('error');
        return;
      }
      setExplanation(data.explanation as string);
      setStatus('done');
    } catch {
      setErrorMessage('Erro de conexão. Tente novamente.');
      setStatus('error');
    }
  };

  if (status === 'done') {
    return (
      <div className="mb-6 rounded-lg border border-border-soft bg-bg-primary px-5 py-4 text-sm text-text-main" style={{ lineHeight: 1.65 }}>
        <div className="flex items-center gap-1.5 text-xs font-medium text-text-meta mb-3">
          <Sparkles size={13} strokeWidth={1.5} />
          Explicação gerada por IA
        </div>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h2: ({ children }) => (
              <h2 className="text-sm font-semibold text-text-main mt-4 mb-1.5 first:mt-0">{children}</h2>
            ),
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          }}
        >
          {explanation}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {!user ? (
        <p className="text-xs text-text-meta">
          Entre na sua conta para ver a explicação detalhada desta questão com IA.
        </p>
      ) : (
        <button
          onClick={() => void handleExplain()}
          disabled={status === 'loading'}
          className="flex items-center gap-2 border border-border-soft rounded-lg px-4 py-2 text-sm font-medium text-text-main hover:bg-bg-secondary transition-colors disabled:opacity-50"
        >
          <Sparkles size={15} strokeWidth={1.5} />
          {status === 'loading' ? 'Gerando explicação...' : 'Entender esta questão'}
        </button>
      )}
      {status === 'error' && (
        <p role="alert" className="mt-2 text-xs text-wrong-text">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

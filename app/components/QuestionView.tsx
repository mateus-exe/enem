'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Clock, ChevronRight, XCircle, ZoomIn, X } from 'lucide-react';
import AlternativeButton from './AlternativeButton';
import { Question, UserAnswerRecord } from '@/app/types';
import { disciplineLabel } from '@/app/services/enemApiService';

interface Props {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  sessionId: string;
  onAnswer: (
    selectedLetter: 'A' | 'B' | 'C' | 'D' | 'E',
    timeSpentSeconds: number
  ) => UserAnswerRecord | undefined;
  onNext: () => void;
  onEnd: () => void;
  isLast: boolean;
}

export default function QuestionView({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  onNext,
  onEnd,
  isLast,
}: Props) {
  const [selected, setSelected] = useState<'A' | 'B' | 'C' | 'D' | 'E' | null>(null);
  const [eliminated, setEliminated] = useState<Set<string>>(new Set());
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState<UserAnswerRecord | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(Date.now());

  // Reset ao trocar de questão
  useEffect(() => {
    setSelected(null);
    setEliminated(new Set());
    setConfirmed(false);
    setResult(null);
    setElapsed(0);
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [question.index, question.year]);

  const handleConfirm = useCallback(() => {
    if (!selected || confirmed) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const record = onAnswer(selected, timeSpent);
    setResult(record ?? null);
    setConfirmed(true);
  }, [selected, confirmed, onAnswer]);

  // Atalhos de teclado
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (confirmed) return;
      const keyMap: Record<string, 'A' | 'B' | 'C' | 'D' | 'E'> = {
        a: 'A', b: 'B', c: 'C', d: 'D', e: 'E',
        A: 'A', B: 'B', C: 'C', D: 'D', E: 'E',
      };
      if (keyMap[e.key]) setSelected(keyMap[e.key]);
      if (e.key === 'Enter') handleConfirm();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [confirmed, handleConfirm]);

  const toggleEliminate = (letter: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEliminated((prev) => {
      const next = new Set(prev);
      if (next.has(letter)) next.delete(letter);
      else next.add(letter);
      return next;
    });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const correctAlt = question.alternatives.find((a) => a.isCorrect);

  // Evita duplicação: remove de `files` as URLs já embutidas no markdown do `context`
  const contextText = question.context ?? '';
  const uniqueFiles = (question.files ?? []).filter(
    (src) => !contextText.includes(src)
  );

  return (
    <div className="max-w-reading mx-auto px-6 py-10">
      {/* Cabeçalho técnico */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-meta font-medium">
          <span>ENEM {question.year}</span>
          <span className="text-border-soft">•</span>
          <span>Questão {question.index}</span>
          <span className="text-border-soft">•</span>
          <span>{disciplineLabel[question.discipline] ?? question.discipline}</span>
          <span className="text-border-soft">•</span>
          <span>
            {questionNumber} / {totalQuestions}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-text-meta tabular-nums flex-shrink-0">
          <Clock size={13} strokeWidth={1.5} />
          {formatTime(elapsed)}
        </div>
      </div>

      {/* Contexto / texto base */}
      {question.context && (
        <div
          className="mb-6 text-sm text-text-main"
          style={{ lineHeight: 1.65 }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => (
                <p className="mb-3 last:mb-0">{children}</p>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-border-soft pl-4 text-text-meta my-3">
                  {children}
                </blockquote>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-text-main">{children}</strong>
              ),
              em: ({ children }) => <em className="italic">{children}</em>,
            }}
          >
            {question.context}
          </ReactMarkdown>
        </div>
      )}

      {/* Imagens da questão — apenas as não embutidas no context */}
      {uniqueFiles.length > 0 && (
        <div className="mb-6 flex flex-col gap-3">
          {uniqueFiles.map((src, i) => (
            <div
              key={i}
              className="relative group cursor-zoom-in"
              onClick={() => setLightboxSrc(src)}
            >
              <img
                src={src}
                alt={`Imagem ${i + 1} da questão`}
                className="max-w-full rounded border border-border-soft bg-white p-2"
              />
              <div className="absolute top-2 right-2 bg-black/40 text-white rounded p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn size={13} strokeWidth={1.5} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comando da questão */}
      {question.alternativesIntroduction && (
        <p
          className="mb-6 text-sm font-semibold text-text-main"
          style={{ lineHeight: 1.65 }}
        >
          {question.alternativesIntroduction}
        </p>
      )}

      {/* Alternativas */}
      <div className="space-y-2.5 mb-8">
        {question.alternatives.map((alt) => (
          <AlternativeButton
            key={alt.letter}
            letter={alt.letter}
            text={alt.text}
            file={alt.file}
            selected={selected === alt.letter}
            eliminated={eliminated.has(alt.letter)}
            confirmed={confirmed}
            isCorrect={alt.isCorrect}
            disabled={confirmed}
            onSelect={() => {
              if (!eliminated.has(alt.letter) && !confirmed) {
                setSelected(alt.letter);
              }
            }}
            onEliminate={(e) => toggleEliminate(alt.letter, e)}
          />
        ))}
      </div>

      {/* Feedback de resposta */}
      {confirmed && result && (
        <div
          className={`mb-6 rounded-lg px-4 py-3 text-sm border ${
            result.isCorrect
              ? 'bg-correct-bg border-correct-border text-correct-text'
              : 'bg-wrong-bg border-wrong-border text-wrong-text'
          }`}
        >
          {result.isCorrect
            ? `Correto. A resposta certa era a alternativa ${correctAlt?.letter}.`
            : `Incorreto. Você marcou ${result.selectedLetter}. A resposta correta era ${result.correctLetter}.`}
        </div>
      )}

      {/* Ações */}
      <div className="flex items-center gap-4">
        {!confirmed ? (
          <>
            <button
              onClick={handleConfirm}
              disabled={!selected}
              className="flex items-center gap-2 bg-action-main text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Confirmar Resposta
            </button>
            <button
              onClick={onEnd}
              className="flex items-center gap-1.5 text-sm text-text-meta hover:text-text-main transition-colors"
            >
              <XCircle size={15} strokeWidth={1.5} />
              Encerrar sessão
            </button>
          </>
        ) : isLast ? (
          <button
            onClick={onEnd}
            className="flex items-center gap-2 bg-action-main text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Encerrar Sessão
          </button>
        ) : (
          <button
            onClick={onNext}
            className="flex items-center gap-2 bg-action-main text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Próxima Questão
            <ChevronRight size={16} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white"
            onClick={() => setLightboxSrc(null)}
          >
            <X size={24} strokeWidth={1.5} />
          </button>
          <img
            src={lightboxSrc}
            alt="Ampliação"
            className="max-w-full max-h-full object-contain rounded"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

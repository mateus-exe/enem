'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Clock, ChevronRight, XCircle, ZoomIn, X, Star } from 'lucide-react';
import AlternativeButton from './AlternativeButton';
import ProgressBar from './ProgressBar';
import ConfirmDialog from './ConfirmDialog';
import { Question, UserAnswerRecord } from '@/app/types';
import { disciplineLabel } from '@/app/services/enemApiService';
import { useTimer } from '@/app/hooks/useTimer';
import { toggleFavorite, isFavorite } from '@/app/services/favoritesService';

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
  sessionError?: string | null;
}

export default function QuestionView({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  onNext,
  onEnd,
  isLast,
  sessionError,
}: Props) {
  const [selected, setSelected] = useState<'A' | 'B' | 'C' | 'D' | 'E' | null>(null);
  const selectedRef = useRef<'A' | 'B' | 'C' | 'D' | 'E' | null>(null);
  const eliminatedRef = useRef<Set<string>>(new Set());
  const [eliminated, setEliminated] = useState<Set<string>>(new Set());
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState<UserAnswerRecord | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const questionKey = `${question.year}-${question.index}`;
  const [favorited, setFavorited] = useState(() => isFavorite(questionKey));

  const { elapsed, reset: resetTimer, stop: stopTimer, getElapsedSeconds } = useTimer();

  const chooseAnswer = useCallback((letter: 'A' | 'B' | 'C' | 'D' | 'E' | null) => {
    selectedRef.current = letter;
    setSelected(letter);
  }, []);

  // Reset ao trocar de questão
  useEffect(() => {
    // Sincroniza o estado local quando a questão muda.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    chooseAnswer(null);
    const emptySet = new Set<string>();
    eliminatedRef.current = emptySet;
    setEliminated(emptySet);
    setConfirmed(false);
    setResult(null);
    setFavorited(isFavorite(`${question.year}-${question.index}`));
    resetTimer();
  }, [question.index, question.year, resetTimer, chooseAnswer]);

  const handleConfirm = useCallback(() => {
    const answer = selectedRef.current;
    if (!answer || confirmed) return;
    stopTimer();
    const timeSpent = getElapsedSeconds();
    const record = onAnswer(answer, timeSpent);
    setResult(record ?? null);
    setConfirmed(true);
  }, [confirmed, onAnswer, stopTimer, getElapsedSeconds]);

  // Atalhos de teclado — usa ref para evitar stale closures em eliminated
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (confirmed) return;
      const keyMap: Record<string, 'A' | 'B' | 'C' | 'D' | 'E'> = {
        a: 'A', b: 'B', c: 'C', d: 'D', e: 'E',
        A: 'A', B: 'B', C: 'C', D: 'D', E: 'E',
      };
      if (keyMap[e.key] && !eliminatedRef.current.has(keyMap[e.key])) {
        chooseAnswer(keyMap[e.key]);
      }
      if (e.key === 'Enter' && selectedRef.current) handleConfirm();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [confirmed, handleConfirm, chooseAnswer]);

  const toggleEliminate = (letter: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEliminated((prev) => {
      const next = new Set(prev);
      if (next.has(letter)) next.delete(letter);
      else next.add(letter);
      eliminatedRef.current = next;
      return next;
    });
  };

  const handleToggleFavorite = () => {
    const isNowFav = toggleFavorite(questionKey, question.year, question.index, question.discipline);
    setFavorited(isNowFav);
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
      <ProgressBar current={questionNumber} total={totalQuestions} />

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
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={handleToggleFavorite}
            aria-label={favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            aria-pressed={favorited}
            className="p-1 rounded hover:bg-bg-secondary transition-colors"
          >
            <Star
              size={16}
              strokeWidth={1.5}
              className={favorited ? 'text-yellow-500 fill-yellow-400' : 'text-text-meta'}
            />
          </button>
          <div className="flex items-center gap-1.5 text-xs text-text-meta tabular-nums" aria-live="off" aria-label={`Tempo: ${formatTime(elapsed)}`}>
            <Clock size={13} strokeWidth={1.5} />
            {formatTime(elapsed)}
          </div>
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
      <div
        className="space-y-2.5 mb-8"
        role="radiogroup"
        aria-label="Alternativas"
      >
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
                chooseAnswer(alt.letter);
              }
            }}
            onEliminate={(e) => toggleEliminate(alt.letter, e)}
          />
        ))}
      </div>

      {/* Feedback de resposta */}
      {sessionError && (
        <div role="alert" className="mb-6 rounded-lg px-4 py-3 text-sm border bg-wrong-bg border-wrong-border text-wrong-text">
          {sessionError}
        </div>
      )}

      {confirmed && result && (
        <div
          role="alert"
          aria-live="polite"
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
              className="flex items-center gap-2 bg-action-main text-action-contrast px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Confirmar Resposta
            </button>
            <button
              onClick={() => setShowEndConfirm(true)}
              className="flex items-center gap-1.5 text-sm text-text-meta hover:text-text-main transition-colors"
            >
              <XCircle size={15} strokeWidth={1.5} />
              Encerrar sessão
            </button>
          </>
        ) : isLast ? (
          <button
            onClick={onEnd}
            className="flex items-center gap-2 bg-action-main text-action-contrast px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Encerrar Sessão
          </button>
        ) : (
          <button
            onClick={onNext}
            className="flex items-center gap-2 bg-action-main text-action-contrast px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
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
          role="dialog"
          aria-modal="true"
          aria-label="Ampliação de imagem"
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white"
            onClick={() => setLightboxSrc(null)}
            aria-label="Fechar ampliação"
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

      {/* Confirmação de encerramento */}
      <ConfirmDialog
        open={showEndConfirm}
        title="Encerrar sessão?"
        message="Você poderá ver o resumo das respostas que já enviou nesta sessão. Deseja encerrar agora?"
        confirmLabel="Encerrar"
        cancelLabel="Continuar estudando"
        onConfirm={() => { setShowEndConfirm(false); onEnd(); }}
        onCancel={() => setShowEndConfirm(false)}
      />
    </div>
  );
}

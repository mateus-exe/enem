'use client';
import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useStudySession } from '@/app/hooks/useStudySession';
import QuestionView from '@/app/components/QuestionView';
import SessionSummary from '@/app/components/SessionSummary';
import { getDueItems } from '@/app/services/reviewQueueService';

export default function RevisaoPage() {
  const {
    session,
    summary,
    loading,
    loadingMessage,
    error,
    startReviewSession,
    submitAnswer,
    nextQuestion,
    endSession,
    dismissSummary,
  } = useStudySession();

  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    if (session || summary) return;
    // Atualiza a contagem de pendências ao entrar ou voltar ao menu.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDueCount(getDueItems().length);
  }, [session, summary]);

  if (summary) {
    return (
      <SessionSummary
        records={summary.records}
        examYear={summary.examYear}
        disciplineFilter={summary.disciplineFilter}
        onNewSession={dismissSummary}
      />
    );
  }

  if (!session) {
    return (
      <div className="max-w-reading mx-auto px-6 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-text-main mb-1">Revisão espaçada</h1>
          <p className="text-sm text-text-meta">
            Reveja as questões no momento certo, antes de esquecer. Acertos espaçam a próxima
            revisão (3, 7 dias e mais); erros voltam amanhã.
          </p>
        </div>

        <div className="bg-bg-primary border border-border-soft rounded-xl p-6 flex flex-col items-start gap-4">
          <div className="flex items-center gap-3">
            <RotateCcw size={20} strokeWidth={1.5} className="text-text-meta" />
            <p className="text-sm text-text-main">
              {dueCount > 0 ? (
                <>
                  <strong className="font-semibold">{dueCount}</strong>{' '}
                  {dueCount === 1 ? 'questão pronta' : 'questões prontas'} para revisar
                </>
              ) : (
                'Nenhuma questão para revisar agora.'
              )}
            </p>
          </div>

          <button
            onClick={() => void startReviewSession()}
            disabled={loading || dueCount === 0}
            className="bg-action-main text-action-contrast px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? loadingMessage || 'Carregando...' : 'Iniciar revisão'}
          </button>

          {error && (
            <p role="alert" className="text-sm text-wrong-text">
              {error}
            </p>
          )}
        </div>

        <p className="text-xs text-text-meta">
          Toda questão que você responde em &quot;Praticar&quot; entra automaticamente na fila de revisão.
        </p>
      </div>
    );
  }

  const currentQuestion = session.questions[session.currentIndex];
  const isLast = session.currentIndex === session.questions.length - 1;

  return (
    <QuestionView
      question={currentQuestion}
      questionNumber={session.currentIndex + 1}
      totalQuestions={session.questions.length}
      sessionId={session.sessionId}
      onAnswer={(letter, time) => submitAnswer(currentQuestion, letter, time)}
      onNext={nextQuestion}
      onEnd={endSession}
      isLast={isLast}
      sessionError={error}
    />
  );
}

'use client';
import { useEffect, useRef } from 'react';
import { useStudySession } from '@/app/hooks/useStudySession';
import PracticeMenu from '@/app/components/PracticeMenu';
import QuestionView from '@/app/components/QuestionView';
import { DayFilter, DisciplineFilter, LanguageFilter } from '@/app/types';
import SessionSummary from '@/app/components/SessionSummary';
import DailyReviewBanner from '@/app/components/DailyReviewBanner';

export default function PraticarPage() {
  const {
    session,
    summary,
    loading,
    loadingMessage,
    error,
    startSession,
    startFavoritesSession,
    submitAnswer,
    nextQuestion,
    endSession,
    dismissSummary,
  } = useStudySession();

  const startedFavoritesRef = useRef(false);
  useEffect(() => {
    if (startedFavoritesRef.current || typeof window === 'undefined') return;
    if (new URLSearchParams(window.location.search).get('favorites') !== '1') return;
    startedFavoritesRef.current = true;
    void startFavoritesSession();
  }, [startFavoritesSession]);

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
      <>
        <DailyReviewBanner />
        <PracticeMenu
          onStart={(year: number | 'random', day: DayFilter, discipline: DisciplineFilter, language: LanguageFilter) =>
            startSession(year, day, discipline, language)
          }
          loading={loading}
          loadingMessage={loadingMessage}
          error={error}
        />
      </>
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

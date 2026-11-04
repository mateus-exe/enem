'use client';
import { useStudySession } from '@/app/hooks/useStudySession';
import PracticeMenu from '@/app/components/PracticeMenu';
import QuestionView from '@/app/components/QuestionView';

export default function PraticarPage() {
  const {
    session,
    loading,
    error,
    startSession,
    submitAnswer,
    nextQuestion,
    endSession,
  } = useStudySession();

  if (!session) {
    return (
      <PracticeMenu
        onStart={startSession}
        loading={loading}
        error={error}
      />
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
    />
  );
}

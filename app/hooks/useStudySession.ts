'use client';
import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  StudySession,
  Question,
  UserAnswerRecord,
  DayFilter,
  DisciplineFilter,
} from '@/app/types';
import {
  fetchQuestionsFiltered,
  fetchRandomYearQuestions,
} from '@/app/services/enemApiService';
import { saveAnswer } from '@/app/services/storageService';

export function useStudySession() {
  const [session, setSession] = useState<StudySession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startSession = useCallback(
    async (
      examYear: number | 'random',
      dayFilter: DayFilter,
      disciplineFilter: DisciplineFilter
    ) => {
      setLoading(true);
      setError(null);
      try {
        let questions: Question[];
        if (examYear === 'random') {
          questions = await fetchRandomYearQuestions(dayFilter, disciplineFilter);
        } else {
          questions = await fetchQuestionsFiltered(examYear, dayFilter, disciplineFilter);
        }
        if (questions.length === 0) {
          setError('Nenhuma questão encontrada para os filtros selecionados.');
          return;
        }
        setSession({
          sessionId: uuidv4(),
          examYear,
          dayFilter,
          disciplineFilter,
          questions,
          currentIndex: 0,
          startedAt: new Date().toISOString(),
        });
      } catch (e) {
        setError('Erro ao carregar questões. Verifique sua conexão e tente novamente.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const submitAnswer = useCallback(
    (
      question: Question,
      selectedLetter: 'A' | 'B' | 'C' | 'D' | 'E',
      timeSpentSeconds: number
    ): UserAnswerRecord | undefined => {
      if (!session) return undefined;
      const correctAlt = question.alternatives.find((a) => a.isCorrect);
      const correctLetter = correctAlt?.letter ?? 'A';
      const isCorrect = selectedLetter === correctLetter;

      const record: UserAnswerRecord = {
        id: uuidv4(),
        sessionId: session.sessionId,
        questionKey: `${question.year}-${question.index}`,
        examYear: question.year,
        examDay:
          question.discipline === 'linguagens' ||
          question.discipline === 'ciencias-humanas'
            ? 1
            : 2,
        discipline: question.discipline,
        selectedLetter,
        correctLetter,
        isCorrect,
        timeSpentSeconds,
        answeredAt: new Date().toISOString(),
      };

      saveAnswer(record);
      return record;
    },
    [session]
  );

  const nextQuestion = useCallback(() => {
    setSession((prev) => {
      if (!prev) return null;
      return { ...prev, currentIndex: prev.currentIndex + 1 };
    });
  }, []);

  const endSession = useCallback(() => {
    setSession(null);
  }, []);

  return { session, loading, error, startSession, submitAnswer, nextQuestion, endSession };
}

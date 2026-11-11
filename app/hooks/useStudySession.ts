'use client';
import { useState, useCallback, useRef } from 'react';

import {
  StudySession,
  Question,
  UserAnswerRecord,
  DayFilter,
  DisciplineFilter,
  LanguageFilter,
} from '@/app/types';
import {
  fetchQuestionsFiltered,
  fetchRandomYearQuestions,
  fetchAllQuestionsForYear,
} from '@/app/services/enemApiService';
import { saveAnswer } from '@/app/services/storageService';
import { saveRemoteAnswer } from '@/app/services/remoteStorageService';
import { loadFavorites } from '@/app/services/favoritesService';
import { supabase } from '@/app/lib/supabase';

export function useStudySession() {
  const [session, setSession] = useState<StudySession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [summary, setSummary] = useState<{
    records: UserAnswerRecord[];
    examYear: number | 'random';
    disciplineFilter: string;
  } | null>(null);
  const sessionRecordsRef = useRef<UserAnswerRecord[]>([]);

  const startSession = useCallback(
    async (
      examYear: number | 'random',
      dayFilter: DayFilter,
      disciplineFilter: DisciplineFilter,
      languageFilter: LanguageFilter
    ) => {
      sessionRecordsRef.current = [];
      setSummary(null);
      setLoading(true);
      setError(null);
      try {
        let questions: Question[];
        if (examYear === 'random') {
          setLoadingMessage('Sorteando anos...');
          questions = await fetchRandomYearQuestions(dayFilter, disciplineFilter, languageFilter);
        } else {
          setLoadingMessage(`Carregando ENEM ${examYear}...`);
          questions = await fetchQuestionsFiltered(examYear, dayFilter, disciplineFilter, languageFilter);
        }
        if (questions.length === 0) {
          setError('Nenhuma questão encontrada para os filtros selecionados.');
          return;
        }
        setSession({
          sessionId: crypto.randomUUID(),
          examYear,
          dayFilter,
          disciplineFilter,
          languageFilter,
          questions,
          currentIndex: 0,
          startedAt: new Date().toISOString(),
        });
      } catch (e) {
        setError('Erro ao carregar questões. Verifique sua conexão e tente novamente.');
        console.error(e);
      } finally {
        setLoading(false);
        setLoadingMessage('');
      }
    },
    []
  );

  const startFavoritesSession = useCallback(async () => {
    sessionRecordsRef.current = [];
    setSummary(null);
    setLoading(true);
    setLoadingMessage('Carregando questões favoritas...');
    setError(null);
    try {
      const favorites = loadFavorites();
      if (favorites.length === 0) {
        setError('Você ainda não tem questões favoritas.');
        return;
      }

      const years = [...new Set(favorites.map((favorite) => favorite.year))];
      const results = await Promise.allSettled(years.map(fetchAllQuestionsForYear));
      const favoritesByKey = new Set(favorites.map((favorite) => favorite.questionKey));
      const questions = results.flatMap((result) => result.status === 'fulfilled' ? result.value : [])
        .filter((question) => favoritesByKey.has(`${question.year}-${question.index}`));

      if (questions.length === 0) {
        setError('Não foi possível carregar suas questões favoritas. Tente novamente.');
        return;
      }

      setSession({
        sessionId: crypto.randomUUID(),
        examYear: 'random',
        dayFilter: 'all',
        disciplineFilter: 'all',
        languageFilter: 'ingles',
        questions,
        currentIndex: 0,
        startedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error(e);
      setError('Erro ao carregar questões favoritas. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  }, []);

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
        id: crypto.randomUUID(),
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

      sessionRecordsRef.current.push(record);

      // Salva localmente (sempre, como fallback)
      const localResult = saveAnswer(record);
      if (!localResult.ok && localResult.error === 'quota') {
        setError('Armazenamento cheio. Exporte seus dados e limpe o histórico nas Estatísticas.');
      }

      // Salva remotamente se houver usuário autenticado (fire-and-forget)
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
          saveRemoteAnswer(record, data.user.id).catch(console.error);
        }
      });

      return record;
    },
    [session]
  );

  const nextQuestion = useCallback(() => {
    setSession((prev) => {
      if (!prev || prev.currentIndex >= prev.questions.length - 1) return prev;
      return { ...prev, currentIndex: prev.currentIndex + 1 };
    });
  }, []);

  const endSession = useCallback(() => {
    if (session) {
      setSummary({
        records: [...sessionRecordsRef.current],
        examYear: session.examYear,
        disciplineFilter: session.disciplineFilter,
      });
    }
    sessionRecordsRef.current = [];
    setSession(null);
  }, [session]);

  const dismissSummary = useCallback(() => setSummary(null), []);

  return {
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
  };
}

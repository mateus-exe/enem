import { Question } from '@/app/types';
import {
  DEFAULT_TOPIC,
  FOREIGN_LANGUAGE_TOPIC,
  TOPIC_RULES,
} from '@/app/data/topicTaxonomy';

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Classifica uma questão em um tópico por pontuação de palavras-chave.
 * Usa enunciado, comando e alternativas. Em caso de empate, vale a primeira regra.
 */
export function classifyQuestion(question: Question): string {
  if (question.language) return FOREIGN_LANGUAGE_TOPIC;

  const haystack = normalize(
    [
      question.title,
      question.context ?? '',
      question.alternativesIntroduction ?? '',
      ...question.alternatives.map((alt) => alt.text),
    ].join(' ')
  );

  const rules = TOPIC_RULES[question.discipline] ?? [];
  let bestTopic = DEFAULT_TOPIC[question.discipline] ?? 'Geral';
  let bestScore = 0;

  for (const rule of rules) {
    let score = 0;
    for (const keyword of rule.keywords) {
      if (haystack.includes(keyword)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestTopic = rule.topic;
    }
  }

  return bestTopic;
}

import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { fetchAllQuestionsForYear } from '@/app/services/enemApiService';
import type { Question } from '@/app/types';

const GEMINI_MODEL = 'gemini-3.8-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const MAX_CONTEXT_CHARS = 6000;

function buildPrompt(question: Question): string {
  const correct = question.alternatives.find((alt) => alt.isCorrect);
  const alternatives = question.alternatives
    .map((alt) => `${alt.letter}) ${alt.text || '[alternativa em imagem]'}`)
    .join('\n');

  return `Você é um professor especialista no ENEM. Explique a questão abaixo de forma didática, em português do Brasil, usando Markdown.

Estrutura obrigatória:
## Por que a alternativa ${correct?.letter ?? '?'} está correta
(raciocínio passo a passo)

## Por que as outras estão erradas
(um item curto para cada alternativa incorreta, apontando o erro conceitual)

## Tópico avaliado
(conceito principal da questão)

## Dica de memorização
(uma dica prática e curta)

Se a questão depender de imagem que não foi fornecida, deixe isso claro e explique com base no que o enunciado e a resposta oficial permitem concluir.

QUESTÃO (ENEM ${question.year}, ${question.discipline}):
${(question.context ?? '').slice(0, MAX_CONTEXT_CHARS)}

${question.alternativesIntroduction ?? ''}

${alternatives}

RESPOSTA OFICIAL: alternativa ${correct?.letter ?? '?'}`;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Serviço de IA não configurado.' }, { status: 500 });
  }

  let body: { year?: unknown; index?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 });
  }

  const year = Number(body.year);
  const index = Number(body.index);
  if (!Number.isInteger(year) || !Number.isInteger(index)) {
    return NextResponse.json({ error: 'Questão inválida.' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  // Exige login: protege a cota da chave Gemini contra uso anônimo
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json(
      { error: 'Faça login para ver explicações geradas por IA.' },
      { status: 401 }
    );
  }

  const questionKey = `${year}-${index}`;

  // 1. Cache compartilhado
  const { data: cached } = await supabase
    .from('question_explanations')
    .select('explanation_md')
    .eq('question_key', questionKey)
    .maybeSingle();

  if (cached?.explanation_md) {
    return NextResponse.json({ explanation: cached.explanation_md, cached: true });
  }

  // 2. A questão é buscada no servidor (o cliente não envia texto arbitrário para o prompt)
  let question: Question | undefined;
  try {
    const questions = await fetchAllQuestionsForYear(year);
    question = questions.find((q) => q.index === index);
  } catch (e) {
    console.error('[api/explain] Erro ao buscar questão:', e);
  }
  if (!question) {
    return NextResponse.json({ error: 'Questão não encontrada.' }, { status: 404 });
  }

  // 3. Geração com Gemini
  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(question) }] }],
        generationConfig: { temperature: 0.4 },
      }),
    });

    if (!res.ok) {
      console.error('[api/explain] Gemini respondeu', res.status, await res.text());
      return NextResponse.json(
        { error: 'A IA não conseguiu responder agora. Tente novamente em instantes.' },
        { status: 502 }
      );
    }

    const json = await res.json();
    const text: string | undefined = json?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? '')
      .join('');

    if (!text) {
      return NextResponse.json({ error: 'A IA retornou uma resposta vazia.' }, { status: 502 });
    }

    // 4. Salva no cache (falha de cache não impede a resposta)
    const { error: cacheError } = await supabase
      .from('question_explanations')
      .insert({ question_key: questionKey, explanation_md: text });
    if (cacheError) console.error('[api/explain] Erro ao salvar cache:', cacheError.message);

    return NextResponse.json({ explanation: text, cached: false });
  } catch (e) {
    console.error('[api/explain] Erro ao chamar Gemini:', e);
    return NextResponse.json({ error: 'Erro ao gerar explicação.' }, { status: 500 });
  }
}

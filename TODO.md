# ✅ TODO — Plataforma Treino ENEM

> Última atualização: 11/11/2026

---

## 🔴 URGENTE — Segurança

- [ ] **Rotacionar a chave do Supabase**
  - Acesse: Supabase Dashboard → Project Settings → API → regenerar `anon` key
  - Atualize o `.env.local` com a nova chave
  - Motivo: a chave foi compartilhada em um chat

- [ ] **Rotacionar a chave do Gemini**
  - Acesse: [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) → deletar a chave atual → criar nova
  - Atualize o `.env.local` com a nova chave
  - Motivo: a chave foi compartilhada em um chat

---

## 🟠 FASE 1 — Fundação (em andamento)

### Supabase — Banco de Dados
- [x] Executar o SQL de migrations no Supabase ✅ 11/11/2026
  - Tabelas `user_answers` e `favorites` criadas com Row Level Security

### Google OAuth (opcional, mas recomendado)
- [ ] Criar credenciais OAuth no Google Cloud Console
  - Acesse: [console.cloud.google.com](https://console.cloud.google.com)
  - Criar projeto → APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
  - Tipo: **Web application**
  - Authorized redirect URI: `https://qfmytrmkgltsoxrpnrvh.supabase.co/auth/v1/callback`
- [ ] Ativar Google OAuth no Supabase
  - Supabase Dashboard → Authentication → Providers → Google → Enable
  - Colar o `Client ID` e `Client Secret` do passo anterior

### Teste local
- [ ] Rodar `npm run dev` e verificar se o botão **Entrar** aparece no Header
- [ ] Testar cadastro com e-mail/senha
- [ ] Testar login com e-mail/senha
- [ ] Testar logout
- [ ] Responder algumas questões logado e confirmar que salvam na tabela `user_answers` do Supabase
  - Verificar em: Supabase Dashboard → Table Editor → `user_answers`

---

## 🟡 FASE 2 — Aprendizado Inteligente (próxima)

- [ ] Criar taxonomia de tópicos (`app/data/topicTaxonomy.ts`)
  - Mapeamento de cada questão para seu tópico/subtópico
  - Começar pelos últimos 5 anos
- [ ] Implementar Dashboard de Pontos Fracos por tópico na página `/estatisticas`
- [ ] Implementar Sistema de Revisão Espaçada (SRS)
  - Tabela `review_queue` no Supabase
  - Algoritmo SM-2
  - Rota `/revisao`
- [ ] Implementar Gabarito Comentado com IA (Gemini)
  - Route Handler: `app/api/explain/route.ts`
  - Componente: `app/components/QuestionExplanation.tsx`
  - Cache de explicações na tabela `question_explanations`

---

## 🟢 FASE 3 — Simulados (futuro)

- [ ] Modo Simulado Completo (45 questões + timer 5h30)
- [ ] Calculadora de nota ENEM / cursos pelo SISU

---

## 🔵 FASE 4 — IA Personalizada (futuro)

- [ ] Plano de Estudo Adaptativo (Gemini)
- [ ] Chat de dúvidas por questão (Gemini streaming)

---

## ⚫ FASE 5 — Social & Engajamento (futuro)

- [ ] Sistema de Streaks e XP
- [ ] Conquistas/Badges
- [ ] Grupos de estudo
- [ ] Notificações push e e-mail semanal

---

## 📦 Deploy (quando estiver pronto)

- [ ] Criar conta na [Vercel](https://vercel.com) e conectar o repositório GitHub
- [ ] Adicionar as variáveis de ambiente na Vercel:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `GEMINI_API_KEY`
- [ ] Configurar domínio customizado (opcional)
- [ ] Adicionar URL de produção como **Authorized redirect URI** no Google Cloud Console

---

## 📝 Notas

- O `.env.local` **nunca** vai para o git (protegido pelo `.gitignore`)
- Usuários sem login continuam funcionando normalmente via `localStorage` — sem breaking changes
- O Gemini API key **não** tem prefixo `NEXT_PUBLIC_` — é server-side apenas (seguro)

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

## 🟡 FASE 2 — Aprendizado Inteligente (código implementado, falta ativar)

### Você precisa fazer
- [ ] Executar `supabase_migration_fase2.sql` no SQL Editor do Supabase
  - Adiciona a coluna `topic` em `user_answers` e cria `review_queue` e `question_explanations`
  - **Sem isso, salvar respostas logado vai falhar** (a coluna `topic` não existe)
- [ ] Reiniciar o `npm run dev` (a rota `/api/explain` lê `GEMINI_API_KEY` do `.env.local`)
- [ ] Testar: responder questões → ver tópicos em `/estatisticas` → ver fila em `/revisao` → clicar "Entender esta questão" (exige login)

### Implementado
- [x] Taxonomia de tópicos por palavras-chave (`app/data/topicTaxonomy.ts`, `app/lib/topicUtils.ts`)
  - Classifica no momento da resposta; respostas antigas ficam sem tópico
- [x] Dashboard de Pontos Fracos, Heatmap de estudo e Proficiência na página `/estatisticas`
- [x] Revisão Espaçada (SM-2 simplificado) em `/revisao`, com banner na página Praticar
  - Fila local (funciona sem login) + sincronização com `review_queue` quando logado
- [x] Gabarito Comentado com IA (Gemini 2.5 Flash) com cache compartilhado
  - Exige login para proteger a cota da chave

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

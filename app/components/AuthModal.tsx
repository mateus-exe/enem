'use client';
import { useState, useEffect, useRef } from 'react';
import { X, Mail, Eye, EyeOff, Chrome } from 'lucide-react';
import { useAuth } from '@/app/lib/authContext';

type Mode = 'login' | 'signup';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AuthModal({ open, onClose }: Props) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);

  // Foca no e-mail ao abrir
  useEffect(() => {
    if (open) {
      setError(null);
      setSuccessMessage(null);
      setEmail('');
      setPassword('');
      setMode('login');
      setTimeout(() => emailRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    let errorMsg: string | null = null;

    if (mode === 'login') {
      errorMsg = await signInWithEmail(email, password);
      if (!errorMsg) {
        onClose();
        return;
      }
    } else {
      errorMsg = await signUpWithEmail(email, password);
      if (!errorMsg) {
        setSuccessMessage('Cadastro realizado! Verifique seu e-mail para confirmar a conta.');
        setLoading(false);
        return;
      }
    }

    // Traduz mensagens comuns do Supabase para PT-BR
    setError(translateError(errorMsg ?? 'Erro desconhecido.'));
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    await signInWithGoogle();
    // O redirecionamento é externo — não precisa de setLoading(false)
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'login' ? 'Entrar na conta' : 'Criar conta'}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-sm bg-bg-primary rounded-2xl border border-border-soft shadow-xl p-6">
        {/* Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-meta hover:text-text-main transition-colors"
          aria-label="Fechar"
        >
          <X size={18} strokeWidth={1.5} />
        </button>

        {/* Título */}
        <h2 className="text-lg font-semibold text-text-main mb-1">
          {mode === 'login' ? 'Entrar' : 'Criar conta'}
        </h2>
        <p className="text-xs text-text-meta mb-6">
          {mode === 'login'
            ? 'Seus dados de estudo ficam sincronizados em todos os dispositivos.'
            : 'Crie sua conta gratuitamente e nunca perca seu progresso.'}
        </p>

        {/* Google OAuth */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 border border-border-soft rounded-lg py-2.5 text-sm font-medium text-text-main hover:bg-bg-secondary transition-colors disabled:opacity-50 mb-4"
        >
          {/* SVG do Google */}
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar com Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-border-soft" />
          <span className="text-xs text-text-meta">ou</span>
          <div className="flex-1 h-px bg-border-soft" />
        </div>

        {/* Formulário e-mail/senha */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="auth-email" className="block text-xs font-medium text-text-main mb-1">
              E-mail
            </label>
            <div className="relative">
              <Mail size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-meta pointer-events-none" />
              <input
                ref={emailRef}
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border-soft bg-bg-secondary text-sm text-text-main placeholder:text-text-meta focus:outline-none focus:ring-2 focus:ring-action-main/30"
              />
            </div>
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-xs font-medium text-text-main mb-1">
              Senha
            </label>
            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pr-9 pl-3 py-2 rounded-lg border border-border-soft bg-bg-secondary text-sm text-text-main placeholder:text-text-meta focus:outline-none focus:ring-2 focus:ring-action-main/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-meta hover:text-text-main transition-colors"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={14} strokeWidth={1.5} /> : <Eye size={14} strokeWidth={1.5} />}
              </button>
            </div>
          </div>

          {/* Erro */}
          {error && (
            <p role="alert" className="text-xs text-wrong-text bg-wrong-bg border border-wrong-border rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Sucesso (cadastro) */}
          {successMessage && (
            <p role="status" className="text-xs text-correct-text bg-correct-bg border border-correct-border rounded-lg px-3 py-2">
              {successMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-action-main text-action-contrast py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        {/* Alterna modo */}
        <p className="text-center text-xs text-text-meta mt-4">
          {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setSuccessMessage(null); }}
            className="text-text-main font-medium underline underline-offset-2 hover:no-underline"
          >
            {mode === 'login' ? 'Criar conta grátis' : 'Entrar'}
          </button>
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tradução de erros comuns do Supabase
// ---------------------------------------------------------------------------

function translateError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (message.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  if (message.includes('User already registered')) return 'Este e-mail já está cadastrado. Tente entrar.';
  if (message.includes('Password should be at least')) return 'A senha deve ter pelo menos 6 caracteres.';
  if (message.includes('Unable to validate email')) return 'E-mail inválido.';
  if (message.includes('signup is disabled')) return 'Cadastros temporariamente desativados.';
  return message;
}

import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * Callback do OAuth (Google): troca o `code` recebido por uma sessão
 * e grava os cookies de autenticação antes de voltar ao app.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next') ?? '/praticar';
  // Evita open redirect: só aceita caminhos internos
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/praticar';

  if (code) {
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

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error('[auth/callback] Erro ao trocar code por sessão:', error.message);
  }

  return NextResponse.redirect(`${origin}/praticar?auth_error=1`);
}

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Cliente Supabase para uso no browser (componentes client-side).
 * Singleton — criado uma única vez para evitar múltiplas instâncias.
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

import { supabase } from '@/app/lib/supabase';
import { FavoriteQuestion } from '@/app/services/favoritesService';

// ---------------------------------------------------------------------------
// Helpers de mapeamento: snake_case (DB) <-> camelCase (app)
// ---------------------------------------------------------------------------

type DbFavoriteRow = {
  user_id: string;
  question_key: string;
  year: number;
  index: number;
  discipline: string;
  added_at: string;
};

function toFavorite(row: DbFavoriteRow): FavoriteQuestion {
  return {
    questionKey: row.question_key,
    year: row.year,
    index: row.index,
    discipline: row.discipline,
    addedAt: row.added_at,
  };
}

// ---------------------------------------------------------------------------
// Funções públicas
// ---------------------------------------------------------------------------

/** Carrega todos os favoritos do usuário autenticado. */
export async function loadRemoteFavorites(): Promise<FavoriteQuestion[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .order('added_at', { ascending: false });

  if (error) {
    console.error('[remoteFavoritesService] Erro ao carregar favoritos:', error.message);
    return [];
  }

  return (data as DbFavoriteRow[]).map(toFavorite);
}

/** Verifica se uma questão está nos favoritos remotos. */
export async function isRemoteFavorite(questionKey: string): Promise<boolean> {
  const { data } = await supabase
    .from('favorites')
    .select('question_key')
    .eq('question_key', questionKey)
    .maybeSingle();

  return data !== null;
}

/**
 * Adiciona ou remove um favorito remotamente.
 * Retorna true se adicionou, false se removeu.
 */
export async function toggleRemoteFavorite(
  questionKey: string,
  year: number,
  index: number,
  discipline: string,
  userId: string
): Promise<boolean> {
  const { data: existing } = await supabase
    .from('favorites')
    .select('question_key')
    .eq('question_key', questionKey)
    .maybeSingle();

  if (existing) {
    // Remove
    await supabase
      .from('favorites')
      .delete()
      .eq('question_key', questionKey);
    return false;
  }

  // Adiciona
  await supabase.from('favorites').insert({
    user_id: userId,
    question_key: questionKey,
    year,
    index,
    discipline,
    added_at: new Date().toISOString(),
  });
  return true;
}

/** Importa (upsert em lote) favoritos do localStorage — usado na migração. */
export async function importRemoteFavorites(
  favorites: FavoriteQuestion[],
  userId: string
): Promise<{ ok: boolean; count: number }> {
  if (favorites.length === 0) return { ok: true, count: 0 };

  const rows = favorites.map((f) => ({
    user_id: userId,
    question_key: f.questionKey,
    year: f.year,
    index: f.index,
    discipline: f.discipline,
    added_at: f.addedAt,
  }));

  const { error } = await supabase
    .from('favorites')
    .upsert(rows, { onConflict: 'question_key,user_id' });

  if (error) {
    console.error('[remoteFavoritesService] Erro ao importar favoritos:', error.message);
    return { ok: false, count: 0 };
  }

  return { ok: true, count: favorites.length };
}

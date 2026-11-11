'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Star, Trash2 } from 'lucide-react';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import { clearFavorites, FavoriteQuestion, loadFavorites, toggleFavorite } from '@/app/services/favoritesService';
import { disciplineLabel } from '@/app/services/enemApiService';

export default function FavoritosPage() {
  const [favorites, setFavorites] = useState<FavoriteQuestion[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);

  const refreshFavorites = useCallback(() => setFavorites(loadFavorites()), []);
  useEffect(() => {
    // Lê o snapshot inicial de favoritos do armazenamento local.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshFavorites();
  }, [refreshFavorites]);

  const sorted = [...favorites].sort((a, b) => b.addedAt.localeCompare(a.addedAt));
  const removeFavorite = (favorite: FavoriteQuestion) => {
    toggleFavorite(favorite.questionKey, favorite.year, favorite.index, favorite.discipline);
    refreshFavorites();
  };
  const removeAll = () => {
    clearFavorites();
    refreshFavorites();
    setConfirmClear(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div><h1 className="text-2xl font-semibold text-text-main mb-1">Favoritos</h1><p className="text-sm text-text-meta">{favorites.length === 0 ? 'Nenhuma questão favoritada ainda.' : `${favorites.length} questão${favorites.length === 1 ? '' : 'ões'} salva${favorites.length === 1 ? '' : 's'}.`}</p></div>
        {favorites.length > 0 && <button onClick={() => setConfirmClear(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-wrong-text border border-wrong-border hover:bg-wrong-bg"><Trash2 size={14} />Limpar tudo</button>}
      </header>

      {sorted.length === 0 ? (
        <div className="text-center py-16 text-text-meta text-sm"><Star size={32} strokeWidth={1} className="mx-auto mb-3 text-border-soft" /><p>Marque questões com ★ durante a prática para salvá-las aqui.</p></div>
      ) : (
        <>
          <Link href="/praticar?favorites=1" className="flex items-center justify-center gap-2 w-full bg-action-main text-action-contrast py-3 rounded-lg text-sm font-semibold hover:opacity-90"><BookOpen size={16} />Praticar favoritos</Link>
          <div className="space-y-2">
            {sorted.map((favorite) => <div key={favorite.questionKey} className="flex items-center justify-between gap-4 bg-bg-primary border border-border-soft rounded-lg px-4 py-3">
              <div className="flex items-center gap-3 min-w-0"><BookOpen size={15} className="text-text-meta flex-shrink-0" /><div className="min-w-0"><p className="text-sm font-medium text-text-main">ENEM {favorite.year} · Questão {favorite.index}</p><p className="text-xs text-text-meta truncate">{disciplineLabel[favorite.discipline] ?? favorite.discipline}</p></div></div>
              <button onClick={() => removeFavorite(favorite)} aria-label={`Remover questão ${favorite.index} de ${favorite.year} dos favoritos`} className="flex-shrink-0 p-1.5 rounded hover:bg-bg-secondary text-text-meta hover:text-wrong-text"><Star size={15} className="fill-yellow-400 text-yellow-500" /></button>
            </div>)}
          </div>
        </>
      )}

      <ConfirmDialog open={confirmClear} title="Limpar favoritos?" message="Todas as questões favoritadas serão removidas. Esta ação não pode ser desfeita." confirmLabel="Limpar tudo" cancelLabel="Cancelar" onConfirm={removeAll} onCancel={() => setConfirmClear(false)} />
    </div>
  );
}

const FAVORITES_KEY = 'enem_favorites_v1';
const FAVORITES_EVENT = 'enem-favorites-updated';

function notifyFavoritesChanged() {
  window.dispatchEvent(new Event(FAVORITES_EVENT));
}

export const favoritesChangedEvent = FAVORITES_EVENT;

export interface FavoriteQuestion {
  questionKey: string; // formato: "year-index"
  year: number;
  index: number;
  discipline: string;
  addedAt: string;
}

export function loadFavorites(): FavoriteQuestion[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? (JSON.parse(raw) as FavoriteQuestion[]) : [];
  } catch {
    return [];
  }
}

export function isFavorite(questionKey: string): boolean {
  return loadFavorites().some((f) => f.questionKey === questionKey);
}

export function toggleFavorite(
  questionKey: string,
  year: number,
  index: number,
  discipline: string
): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const existing = loadFavorites();
    const idx = existing.findIndex((f) => f.questionKey === questionKey);

    if (idx >= 0) {
      existing.splice(idx, 1);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(existing));
      notifyFavoritesChanged();
      return false; // removeu
    }

    existing.push({
      questionKey,
      year,
      index,
      discipline,
      addedAt: new Date().toISOString(),
    });
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(existing));
    notifyFavoritesChanged();
    return true; // adicionou
  } catch (e) {
    console.error('Erro ao salvar favorito:', e);
    return false;
  }
}

export function clearFavorites(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(FAVORITES_KEY);
  notifyFavoritesChanged();
}

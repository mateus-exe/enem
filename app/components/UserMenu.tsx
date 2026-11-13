'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { LogOut, ChevronDown, Upload, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/app/lib/authContext';
import { loadAnswers } from '@/app/services/storageService';
import { loadFavorites } from '@/app/services/favoritesService';
import { importRemoteAnswers } from '@/app/services/remoteStorageService';
import { importRemoteFavorites } from '@/app/services/remoteFavoritesService';

const MIGRATION_KEY = 'enem_migrated_to_supabase';

export default function UserMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrationDone, setMigrationDone] = useState(false);
  const [hasMigrationData, setHasMigrationData] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Verifica se há dados locais para migrar
  useEffect(() => {
    if (!user) return;
    const alreadyMigrated = localStorage.getItem(MIGRATION_KEY) === user.id;
    if (alreadyMigrated) return;

    const localAnswers = loadAnswers();
    const localFavorites = loadFavorites();
    setHasMigrationData(localAnswers.length > 0 || localFavorites.length > 0);
  }, [user]);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleMigrate = useCallback(async () => {
    if (!user) return;
    setMigrating(true);

    const localAnswers = loadAnswers();
    const localFavorites = loadFavorites();

    await importRemoteAnswers(localAnswers, user.id);
    await importRemoteFavorites(localFavorites, user.id);

    localStorage.setItem(MIGRATION_KEY, user.id);
    setHasMigrationData(false);
    setMigrationDone(true);
    setMigrating(false);
  }, [user]);

  if (!user) return null;

  const displayName = user.user_metadata?.full_name as string | undefined;
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const initials = (displayName ?? user.email ?? 'U')
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div ref={menuRef} className="relative">
      {/* Botão do avatar */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Menu do usuário"
        className="flex items-center gap-1.5 p-1 rounded-md hover:bg-bg-secondary transition-colors"
      >
        {/* Avatar */}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName ?? 'Avatar'}
            className="w-7 h-7 rounded-full object-cover border border-border-soft"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="w-7 h-7 rounded-full bg-action-main text-action-contrast text-[11px] font-semibold flex items-center justify-center">
            {initials}
          </span>
        )}
        <ChevronDown
          size={12}
          strokeWidth={2}
          className={`text-text-meta transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-bg-primary border border-border-soft rounded-xl shadow-lg py-1 z-50">
          {/* Info do usuário */}
          <div className="px-3 py-2.5 border-b border-border-soft">
            <p className="text-sm font-medium text-text-main truncate">
              {displayName ?? 'Usuário'}
            </p>
            <p className="text-xs text-text-meta truncate">{user.email}</p>
          </div>

          {/* Migração de dados locais */}
          {hasMigrationData && (
            <div className="mx-2 my-2 p-2.5 rounded-lg bg-bg-secondary border border-border-soft">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} strokeWidth={1.5} className="text-yellow-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-text-main mb-1">
                    Dados locais encontrados
                  </p>
                  <p className="text-[11px] text-text-meta mb-2">
                    Você tem histórico salvo neste dispositivo. Deseja sincronizá-lo com sua conta?
                  </p>
                  <button
                    onClick={handleMigrate}
                    disabled={migrating}
                    className="flex items-center gap-1.5 text-[11px] font-medium bg-action-main text-action-contrast px-2.5 py-1 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <Upload size={11} strokeWidth={2} />
                    {migrating ? 'Sincronizando...' : 'Sincronizar dados'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Confirmação de migração */}
          {migrationDone && (
            <p className="mx-3 my-1.5 text-xs text-correct-text">
              ✓ Dados sincronizados com sucesso!
            </p>
          )}

          {/* Sair */}
          <button
            onClick={async () => { setOpen(false); await signOut(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-meta hover:text-text-main hover:bg-bg-secondary transition-colors"
          >
            <LogOut size={14} strokeWidth={1.5} />
            Sair da conta
          </button>
        </div>
      )}
    </div>
  );
}

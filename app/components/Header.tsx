'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, BarChart2, Moon, Sun } from 'lucide-react';

const tabs = [
  { href: '/praticar', label: 'Praticar', icon: BookOpen },
  { href: '/estatisticas', label: 'Estatísticas', icon: BarChart2 },
];

function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('enem_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored ? stored === 'dark' : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('enem_theme', next ? 'dark' : 'light');
  };

  return { dark, toggle };
}

export default function Header() {
  const pathname = usePathname();
  const { dark, toggle } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-bg-primary border-b border-border-soft h-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
        <span className="text-sm font-semibold text-text-main tracking-tight">
          Treino ENEM
        </span>
        <div className="flex items-center gap-1">
          <nav className="flex items-center gap-1">
            {tabs.map(({ href, label, icon: Icon }) => {
              const active = pathname?.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? 'bg-bg-secondary text-text-main'
                      : 'text-text-meta hover:text-text-main hover:bg-bg-secondary'
                  }`}
                >
                  <Icon size={15} strokeWidth={1.5} />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>
          <button
            onClick={toggle}
            aria-label={dark ? 'Ativar modo claro' : 'Ativar modo escuro'}
            className="ml-2 p-2 rounded-md text-text-meta hover:text-text-main hover:bg-bg-secondary transition-colors"
          >
            {dark ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
          </button>
        </div>
      </div>
    </header>
  );
}

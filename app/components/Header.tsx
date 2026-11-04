'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, BarChart2 } from 'lucide-react';

const tabs = [
  { href: '/praticar', label: 'Praticar', icon: BookOpen },
  { href: '/estatisticas', label: 'Estatísticas', icon: BarChart2 },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border-soft h-14">
      <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
        <span className="text-sm font-semibold text-text-main tracking-tight">
          Treino ENEM
        </span>
        <nav className="flex items-center gap-1">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? 'bg-bg-secondary text-text-main'
                    : 'text-text-meta hover:text-text-main hover:bg-bg-secondary'
                }`}
              >
                <Icon size={15} strokeWidth={1.5} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

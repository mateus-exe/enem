import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import Header from '@/app/components/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Treino ENEM',
  description: 'Plataforma de treino para o ENEM com questões reais',
};

const themeScript = `try {
  var storedTheme = localStorage.getItem('enem_theme');
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  var useDarkTheme = storedTheme ? storedTheme === 'dark' : prefersDark;
  document.documentElement.classList.toggle('dark', useDarkTheme);
} catch (error) {}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <Script id="theme-init" strategy="beforeInteractive">{themeScript}</Script>
      <body className={`${inter.className} bg-bg-secondary min-h-screen`}>
        <Header />
        <main className="pt-14">{children}</main>
      </body>
    </html>
  );
}

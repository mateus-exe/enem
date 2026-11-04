import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/app/components/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Treino ENEM',
  description: 'Plataforma de treino para o ENEM com questões reais',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-bg-secondary min-h-screen`}>
        <Header />
        <main className="pt-14">{children}</main>
      </body>
    </html>
  );
}

import { Averia_Serif_Libre, Lekton } from 'next/font/google';
import type { ReactNode } from 'react';

const averia = Averia_Serif_Libre({
  weight: ['300', '400', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-averia',
  display: 'swap',
});

const lekton = Lekton({
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-lekton',
  display: 'swap',
});

export default function WwwLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${averia.variable} ${lekton.variable}`}
      style={{ colorScheme: 'light' }}
    >
      {children}
    </div>
  );
}

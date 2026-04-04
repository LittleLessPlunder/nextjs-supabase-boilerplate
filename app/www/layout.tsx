import type { Metadata } from 'next';
import { Averia_Serif_Libre } from 'next/font/google';
import PublicNav from '@/components/public/PublicNav';
import PublicFooter from '@/components/public/PublicFooter';

const averia = Averia_Serif_Libre({
  weight: ['300', '400', '700'],
  subsets: ['latin'],
  variable: '--font-averia',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Yoga Tayo — El Nido, Palawan',
  description:
    'Yoga, pilates, and good food in the heart of El Nido. Move. Eat. Be.',
  robots: 'index, follow',
  icons: { icon: '/ytw-favicon-olive.jpg' },
  openGraph: {
    title: 'Yoga Tayo — El Nido, Palawan',
    description: 'Yoga, pilates, and good food in the heart of El Nido.',
    type: 'website',
  },
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${averia.variable} font-sans`}>
      <PublicNav />
      {children}
      <PublicFooter />
    </div>
  );
}

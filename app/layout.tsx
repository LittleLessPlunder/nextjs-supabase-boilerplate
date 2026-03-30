import { Metadata } from 'next';
import { PropsWithChildren } from 'react';
import { Rubik } from 'next/font/google';
import { getURL } from '@/utils/helpers';
import '@/styles/main.css';
import { ThemeProvider } from '@/app/theme-provider';
import { TenantProvider } from '@/utils/tenant-context';
import { Toaster } from '@/components/ui/toaster';

const rubik = Rubik({
  subsets: ['latin'],
  variable: '--font-rubik',
  display: 'swap',
});

const meta = {
  title: 'YTW Portal',
  description: 'Business Management System — Yoga Tayo Wellness, El Nido',
  cardImage: '/og.png',
  robots: 'noindex, nofollow',
  favicon: '/favicon.ico',
  url: getURL()
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: meta.title,
    description: meta.description,
    referrer: 'origin-when-cross-origin',
    keywords: ['YTW', 'Yoga Tayo', 'El Nido', 'BMS'],
    authors: [{ name: 'Yoga Tayo Wellness' }],
    creator: 'Yoga Tayo Wellness',
    publisher: 'Yoga Tayo Wellness',
    robots: meta.robots,
    icons: { icon: meta.favicon },
    metadataBase: new URL(meta.url),
    openGraph: {
      url: meta.url,
      title: meta.title,
      description: meta.description,
      images: [meta.cardImage],
      type: 'website',
      siteName: meta.title
    },
    twitter: {
      card: 'summary_large_image',
      site: '@Vercel',
      creator: '@Vercel',
      title: meta.title,
      description: meta.description,
      images: [meta.cardImage]
    }
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={rubik.variable}>
      <body className="font-sans">
        <TenantProvider>
          <ThemeProvider
            defaultTheme="system"
          >
            <main
              id="skip"
              className="min-h-[calc(100dvh-4rem)] md:min-h[calc(100dvh-5rem)]"
            >
              {children}
            </main>
            <Toaster />
          </ThemeProvider>
        </TenantProvider>
      </body>
    </html>
  );
}

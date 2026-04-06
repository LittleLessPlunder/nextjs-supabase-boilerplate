import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Yoga Tayo — El Nido, Palawan',
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

import { Metadata } from 'next';
import LandingPage from '@/components/landing/LandingPage';
import { createClient } from '@/utils/supabase/server';

export const metadata: Metadata = {
  title: 'Yoga Tayo Wellness — El Nido, Palawan',
  description:
    'Yoga, pilates, sound healing and mindful movement in El Nido, Palawan. All levels welcome. Book a class today.',
  robots: 'index, follow',
  icons: { icon: '/ytw-favicon-olive.jpg' },
  openGraph: {
    title: 'Yoga Tayo Wellness — El Nido, Palawan',
    description:
      'Yoga, pilates, sound healing and mindful movement in El Nido, Palawan. All levels welcome.',
    siteName: 'Yoga Tayo Wellness',
    type: 'website',
  },
};

export default async function Landing() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return <LandingPage user={user} />;
} 
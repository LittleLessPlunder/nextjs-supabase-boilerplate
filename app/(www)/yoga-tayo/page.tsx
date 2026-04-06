import { Metadata } from 'next';
import YogaTayoPage from '@/components/www/YogaTayoPage';

export const metadata: Metadata = {
  title: 'Yoga Tayo + Om Nom Nom — El Nido, Palawan',
  description:
    'A yoga & pilates studio and café in the heart of El Nido, Palawan. Find your flow. Good food, good mood.',
  robots: 'index, follow',
};

export default function Page() {
  return <YogaTayoPage />;
}

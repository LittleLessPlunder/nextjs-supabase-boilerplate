import { Metadata } from 'next';
import HeroSection from '@/components/public/HeroSection';
import SpaceSection from '@/components/public/SpaceSection';
import ClassesSection from '@/components/public/ClassesSection';
import BookSection from '@/components/public/BookSection';
import CafeSection from '@/components/public/CafeSection';
import LocationSection from '@/components/public/LocationSection';

export const metadata: Metadata = {
  title: 'Yoga Tayo — El Nido, Palawan',
};

export default function PublicHome() {
  return (
    <main>
      <HeroSection />
      <SpaceSection />
      <ClassesSection />
      <BookSection />
      <CafeSection />
      <LocationSection />
    </main>
  );
}

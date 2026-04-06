'use client';

import { useState } from 'react';
import SiteNav            from './SiteNav';
import HeroSection3D      from './HeroSection3D';
import ShowcaseSection    from './ShowcaseSection';
import CafeGallerySection from './CafeGallerySection';
import SiteFooter         from './SiteFooter';
import BookingModal       from './BookingModal';

export default function YogaTayoPage() {
  const [bookingOpen, setBookingOpen] = useState(false);

  return (
    <>
      <SiteNav onBook={() => setBookingOpen(true)} />
      <HeroSection3D onBook={() => setBookingOpen(true)} />
      <ShowcaseSection />
      <CafeGallerySection />
      <SiteFooter />
      <BookingModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} />
    </>
  );
}

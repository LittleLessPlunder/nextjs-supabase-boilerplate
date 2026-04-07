'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { LandingNav } from './LandingNav';
import { Hero } from './Hero';
import { Services } from './Services';
import { About } from './About';
import { CafeSection } from './CafeSection';
import { Cta } from './Cta';
import { Footer } from './Footer';
import { BookingModal, type PublicSlot } from './BookingModal';

export default function LandingPage({ user }: { user: User | null }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [preselectedSlot, setPreselectedSlot] = useState<PublicSlot | null>(null);

  function openModal(slot?: PublicSlot) {
    setPreselectedSlot(slot ?? null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setPreselectedSlot(null);
  }

  return (
    <div className="min-h-screen bg-background">
      <LandingNav user={user} onBook={openModal} />
      <main>
        <Hero onBook={openModal} />
        <Services onBook={openModal} />
        <About />
        <CafeSection />
        <Cta />
      </main>
      <Footer />
      <BookingModal open={modalOpen} preselectedSlot={preselectedSlot} onClose={closeModal} />
    </div>
  );
}

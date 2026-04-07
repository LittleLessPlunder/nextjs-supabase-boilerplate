'use client';

import { User } from '@supabase/supabase-js';
import { LandingNav } from './LandingNav';
import { Hero } from './Hero';
import { Services } from './Services';
import { About } from './About';
import { Cta } from './Cta';
import { Footer } from './Footer';

export default function LandingPage({ user }: { user: User | null }) {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav user={user} />
      <main>
        <Hero />
        <Services />
        <About />
        <Cta />
      </main>
      <Footer />
    </div>
  );
}

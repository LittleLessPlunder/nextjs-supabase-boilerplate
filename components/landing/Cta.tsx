'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Cta = () => {
  return (
    <section id="location" className="py-24 sm:py-32 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        {/* Location strip */}
        <div className="rounded-3xl overflow-hidden grid lg:grid-cols-2 gap-0 border border-border">
          {/* Map-like colour block */}
          <div
            className="min-h-56 lg:min-h-auto"
            style={{
              background:
                'linear-gradient(160deg, hsl(200 45% 72%) 0%, hsl(185 50% 60%) 40%, hsl(175 45% 55%) 100%)',
            }}
          >
            {/* Decorative overlay */}
            <div className="h-full flex items-end p-8">
              <div className="rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 px-5 py-4 text-white">
                <p className="text-xs font-medium opacity-80 uppercase tracking-widest mb-1">Find us</p>
                <p className="font-semibold text-lg leading-snug">El Nido, Palawan</p>
                <p className="text-sm opacity-80">Philippines · 5313</p>
              </div>
            </div>
          </div>

          {/* CTA copy */}
          <div
            className="flex flex-col justify-center p-10 lg:p-14"
            style={{ background: 'hsl(16 50% 43%)' }}
          >
            <p className="text-xs font-medium text-primary-foreground/60 uppercase tracking-widest mb-4">
              Ready to start?
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary-foreground mb-4 leading-tight">
              Book your first class today.
            </h2>
            <p className="text-primary-foreground/75 leading-relaxed mb-8">
              Drop-in sessions available daily. Bring a mat — or borrow one of ours.
              No experience necessary.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                variant="secondary"
                size="lg"
                className="rounded-full px-7 gap-2 bg-white text-primary hover:bg-white/90"
              >
                <a href="#classes">
                  View schedule
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="rounded-full px-7 text-primary-foreground hover:bg-white/15"
              >
                <Link href="/auth/signin">Team login</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

'use client';

import Link from 'next/link';
import { ArrowRight, Wind } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-background">
      {/* Warm radial backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 60% 40%, hsl(16 55% 90% / 0.55) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 20% 80%, hsl(67 20% 88% / 0.35) 0%, transparent 60%)',
        }}
      />

      {/* Subtle grain overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6 pt-28 pb-20 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left — copy */}
        <div className="space-y-8">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground tracking-wide">
            <Wind className="h-3 w-3 text-primary" />
            El Nido, Palawan · Philippines
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] text-foreground">
            Find your{' '}
            <span
              className="relative inline-block"
              style={{
                WebkitTextFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                backgroundImage: 'linear-gradient(135deg, hsl(16 50% 43%) 0%, hsl(16 60% 58%) 100%)',
              }}
            >
              flow
            </span>
            <br />
            in paradise.
          </h1>

          {/* Sub-copy */}
          <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
            Yoga, pilates, and mindful movement — surrounded by the turquoise waters
            and lush limestone cliffs of El Nido. All levels welcome.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full px-7 gap-2">
              <a href="#classes">
                Browse classes
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-7">
              <a href="#about">Our story</a>
            </Button>
          </div>

          {/* Social proof strip */}
          <div className="flex items-center gap-6 pt-2">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">500+</p>
              <p className="text-xs text-muted-foreground">Sessions held</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">12+</p>
              <p className="text-xs text-muted-foreground">Class styles</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">4.9★</p>
              <p className="text-xs text-muted-foreground">Guest rating</p>
            </div>
          </div>
        </div>

        {/* Right — visual grid */}
        <div className="relative hidden lg:block">
          <div className="grid grid-cols-2 gap-3">
            {/* Top-left — tall card */}
            <div className="col-span-1 row-span-2 rounded-2xl overflow-hidden bg-[hsl(16_30%_88%)] aspect-[3/4] flex items-end p-5">
              <div className="space-y-1">
                <p className="text-xs font-medium text-[hsl(16_50%_35%)] uppercase tracking-widest">Morning Flow</p>
                <p className="text-sm text-[hsl(16_30%_25%)]">Sunrise Hatha</p>
              </div>
            </div>

            {/* Top-right — square card */}
            <div className="rounded-2xl overflow-hidden bg-[hsl(67_15%_86%)] aspect-square flex items-end p-5">
              <div className="space-y-1">
                <p className="text-xs font-medium text-[hsl(67_20%_30%)] uppercase tracking-widest">Pilates</p>
                <p className="text-sm text-[hsl(67_20%_20%)]">Mat & Reform</p>
              </div>
            </div>

            {/* Bottom-right — wide card */}
            <div className="rounded-2xl overflow-hidden bg-[hsl(34_20%_84%)] aspect-square flex items-end p-5">
              <div className="space-y-1">
                <p className="text-xs font-medium text-[hsl(34_30%_30%)] uppercase tracking-widest">Meditation</p>
                <p className="text-sm text-[hsl(34_30%_20%)]">Breathwork & Yin</p>
              </div>
            </div>
          </div>

          {/* Floating accent badge */}
          <div className="absolute -bottom-4 -left-6 rounded-2xl bg-card border border-border shadow-md px-5 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center">
              <Wind className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Next class</p>
              <p className="text-sm font-semibold text-foreground">Tomorrow · 7 AM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade into next section */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 inset-x-0 h-24"
        style={{ background: 'linear-gradient(to bottom, transparent, hsl(var(--background)))' }}
      />
    </section>
  );
}

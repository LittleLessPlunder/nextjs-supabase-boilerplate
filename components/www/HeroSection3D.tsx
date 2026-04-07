'use client';

import dynamic from 'next/dynamic';
import { useRef, useEffect } from 'react';
import gsap from 'gsap';

const HeroScene = dynamic(() => import('./HeroScene'), { ssr: false });

interface HeroSection3DProps {
  onBook: () => void;
}

export default function HeroSection3D({ onBook }: HeroSection3DProps) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('.hero-eyebrow', { y: 30, opacity: 0, duration: 1.0, delay: 0.5 })
        .from('.hero-title', { y: 60, opacity: 0, duration: 1.4, stagger: 0.12 }, '-=0.5')
        .from('.hero-sub', { y: 24, opacity: 0, duration: 1.0 }, '-=0.6')
        .from('.hero-cta', { y: 20, opacity: 0, duration: 0.8 }, '-=0.5');
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden"
      style={{ background: '#1C1207' }}
    >
      {/* Three.js canvas */}
      <div className="absolute inset-0">
        <HeroScene />
      </div>

      {/* Gradient vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 60%, transparent 30%, rgba(28,18,7,0.7) 100%)',
        }}
      />

      {/* Grain */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '180px 180px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center h-full px-8 md:px-16 lg:px-24 max-w-7xl">
        <p className="hero-eyebrow font-label text-ytw-terracotta text-[10px] tracking-[0.4em] uppercase mb-8">
          El Nido · Palawan · Philippines
        </p>

        <h1 className="font-display font-light leading-none mb-8">
          <span
            className="hero-title block text-ytw-offwhite"
            style={{ fontSize: 'clamp(64px, 10vw, 148px)' }}
          >
            Yoga
          </span>
          <span
            className="hero-title block text-ytw-terracotta italic"
            style={{ fontSize: 'clamp(64px, 10vw, 148px)' }}
          >
            Tayo.
          </span>
        </h1>

        <p className="hero-sub font-sans text-white/50 text-[15px] md:text-[17px] leading-relaxed mb-12 max-w-sm">
          A studio above the sea. Sunrise yoga, flowing breath, an island café below.
          Beachfront · 2nd floor · Lio Beach.
        </p>

        <div className="hero-cta flex flex-wrap items-center gap-6">
          {/* Primary CTA — dark wipe-out on hover */}
          <button
            onClick={onBook}
            className="group relative overflow-hidden bg-ytw-terracotta text-white font-label text-[11px] tracking-[0.25em] uppercase px-10 py-4"
          >
            <span
              className="absolute inset-0 bg-ytw-dark translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)]"
              aria-hidden="true"
            />
            <span className="relative z-10 flex items-center gap-3">
              Book a class
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
                →
              </span>
            </span>
          </button>

          {/* Ghost secondary link */}
          <button
            onClick={() => document.getElementById('studio')?.scrollIntoView({ behavior: 'smooth' })}
            className="group relative font-label text-white/50 text-[11px] tracking-[0.25em] uppercase py-4 hover:text-white transition-colors duration-300"
          >
            Our studio
            <span className="absolute bottom-3 left-0 h-px w-0 bg-white/40 group-hover:w-full transition-[width] duration-300 ease-out" />
          </button>
        </div>
      </div>

      {/* Scroll cue — animated line drop */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
        <span className="font-label text-white/30 text-[9px] tracking-[0.3em] uppercase">Scroll</span>
        <div className="relative w-px h-10 overflow-hidden">
          <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-white/50 to-transparent animate-[scrollDrop_1.8s_ease-in-out_infinite]" />
        </div>
      </div>
    </section>
  );
}

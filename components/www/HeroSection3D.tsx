'use client';

import dynamic from 'next/dynamic';
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

const HeroScene = dynamic(() => import('./HeroScene'), { ssr: false });

interface HeroSection3DProps {
  onBook: () => void;
}

export default function HeroSection3D({ onBook }: HeroSection3DProps) {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.hero-eyebrow', { y: 30, opacity: 0, duration: 1.0, delay: 0.6 })
      .from('.hero-title', { y: 60, opacity: 0, duration: 1.4, stagger: 0.12 }, '-=0.5')
      .from('.hero-sub', { y: 24, opacity: 0, duration: 1.0 }, '-=0.6')
      .from('.hero-cta', { y: 20, opacity: 0, duration: 0.8 }, '-=0.5');
  }, { scope: containerRef });

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

        <button
          onClick={onBook}
          className="hero-cta self-start inline-flex items-center gap-3 bg-ytw-terracotta text-white font-label text-[11px] tracking-[0.25em] uppercase px-10 py-4 hover:bg-ytw-cognac transition-colors duration-300"
        >
          Book a class
          <span aria-hidden>→</span>
        </button>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
        <div className="w-px h-12 bg-white/40 animate-pulse" />
        <span className="font-label text-white text-[9px] tracking-[0.3em] uppercase">Scroll</span>
      </div>
    </section>
  );
}

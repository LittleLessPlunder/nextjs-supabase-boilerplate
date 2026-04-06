'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

// Stock hero image — replace src with your own video or image
const HERO_POSTER =
  'https://images.pexels.com/photos/1051838/pexels-photo-1051838.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop';

export default function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.hero-eyebrow', { y: 20, opacity: 0, duration: 1, delay: 0.3 })
      .from('.hero-headline', { y: 50, opacity: 0, duration: 1.2 }, '-=0.7')
      .from('.hero-sub',      { y: 20, opacity: 0, duration: 0.9 }, '-=0.8')
      .from('.hero-cta',      { y: 16, opacity: 0, duration: 0.8 }, '-=0.6')
      .from('.hero-scroll',   { opacity: 0, duration: 0.8 },        '-=0.4');
  }, { scope: containerRef });

  return (
    <section
      ref={containerRef}
      className="relative h-screen min-h-[600px] overflow-hidden flex items-center justify-center"
    >
      {/* Background — video with image poster fallback */}
      {/* To enable video: add your .mp4 to /public/hero-video.mp4 */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        poster={HERO_POSTER}
        src="/hero-video.mp4"
        aria-hidden="true"
      />

      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(13,11,9,0.55) 0%, rgba(13,11,9,0.35) 50%, rgba(13,11,9,0.65) 100%)',
        }}
      />

      {/* Grain texture */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />

      {/* Hero content */}
      <div className="relative z-10 text-center text-white px-6 max-w-5xl mx-auto">
        <p className="hero-eyebrow font-label text-white/60 text-[11px] tracking-[0.3em] uppercase mb-8">
          El Nido, Palawan
        </p>

        <h1
          className="hero-headline font-display font-light leading-none tracking-tight text-white"
          style={{ fontSize: 'clamp(60px, 11vw, 144px)' }}
        >
          Find your
          <br />
          <em className="not-italic" style={{ fontStyle: 'italic' }}>flow</em>
        </h1>

        <p className="hero-sub font-label text-white/65 text-[12px] tracking-[0.25em] uppercase mt-8">
          Yoga · Pilates · Meditation
        </p>

        <div className="hero-cta mt-12">
          <button
            onClick={() => document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center gap-3 border border-white/50 text-white font-label text-[11px] tracking-[0.22em] uppercase px-8 py-4 hover:bg-white hover:text-ytw-dark transition-all duration-500"
          >
            Book a Class
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hero-scroll absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
        <span className="font-label text-white/40 text-[9px] tracking-[0.3em] uppercase">Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-white/40 to-transparent" />
      </div>
    </section>
  );
}

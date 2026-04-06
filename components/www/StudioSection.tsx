'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const STUDIO_IMAGE =
  'https://images.pexels.com/photos/4056535/pexels-photo-4056535.jpeg?auto=compress&cs=tinysrgb&w=1400';

export default function StudioSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from('.studio-label', {
      x: -30, opacity: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: '.studio-label', start: 'top 85%' },
    });
    gsap.from('.studio-text', {
      y: 40, opacity: 0, duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: '.studio-text', start: 'top 80%' },
    });
    gsap.from('.studio-image-wrap', {
      x: 50, opacity: 0, duration: 1.2, ease: 'power3.out',
      scrollTrigger: { trigger: '.studio-image-wrap', start: 'top 80%' },
    });
    gsap.from('.studio-rule', {
      scaleX: 0, duration: 0.9, ease: 'power3.out', transformOrigin: 'left center',
      scrollTrigger: { trigger: '.studio-rule', start: 'top 85%' },
    });
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      id="studio"
      className="bg-ytw-off-white overflow-hidden"
    >
      {/* Top rule */}
      <div className="studio-rule mx-8 md:mx-14 h-px bg-ytw-terracotta/30" />

      <div className="px-8 md:px-14 py-24 md:py-36 grid md:grid-cols-2 gap-16 md:gap-24 items-start">
        {/* Left column */}
        <div>
          <div className="studio-label flex items-center gap-4 mb-10">
            <span className="font-label text-ytw-terracotta text-[10px] tracking-[0.3em] uppercase">
              01
            </span>
            <div className="h-px flex-1 bg-ytw-terracotta/30 max-w-[40px]" />
            <span className="font-label text-ytw-cognac/60 text-[10px] tracking-[0.3em] uppercase">
              The Studio
            </span>
          </div>

          <div className="studio-text">
            <h2
              className="font-display font-light text-ytw-dark leading-tight mb-8"
              style={{ fontSize: 'clamp(36px, 4.5vw, 64px)' }}
            >
              A sanctuary
              <br />
              at the edge
              <br />
              <em>of the island</em>
            </h2>

            <p className="font-sans text-ytw-dark/70 text-[16px] leading-relaxed max-w-sm">
              Yoga Tayo is a boutique wellness studio rooted in El Nido's natural beauty.
              We offer daily yoga and pilates classes for all levels — from sunrise flows
              overlooking the sea to candlelit evening sessions.
            </p>

            <p className="font-sans text-ytw-dark/70 text-[16px] leading-relaxed max-w-sm mt-5">
              Tayo means <em>we</em> in Filipino — because this practice is better together.
            </p>

            <button
              onClick={() => document.getElementById('classes')?.scrollIntoView({ behavior: 'smooth' })}
              className="mt-10 font-label text-ytw-terracotta text-[11px] tracking-[0.22em] uppercase flex items-center gap-2 hover:gap-4 transition-all duration-300"
            >
              See our classes <span>→</span>
            </button>
          </div>
        </div>

        {/* Right column — image */}
        <div className="studio-image-wrap relative">
          <div className="aspect-[4/5] overflow-hidden">
            <img
              src={STUDIO_IMAGE}
              alt="Yoga Tayo studio — yoga session in El Nido"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          {/* Accent caption */}
          <p className="mt-4 font-label text-ytw-cognac/50 text-[10px] tracking-[0.2em] uppercase text-right">
            Replace with your own photo
          </p>
        </div>
      </div>
    </section>
  );
}

'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function BookSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from('.book-headline', {
      y: 60, opacity: 0, duration: 1.2, ease: 'power3.out',
      scrollTrigger: { trigger: '.book-headline', start: 'top 80%' },
    });
    gsap.from('.book-col', {
      y: 40, opacity: 0, duration: 1, stagger: 0.2, ease: 'power3.out',
      scrollTrigger: { trigger: '.book-col', start: 'top 80%' },
    });
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      id="book"
      className="bg-ytw-dark py-28 md:py-40 px-8 md:px-14 overflow-hidden"
    >
      {/* Headline */}
      <div className="border-b border-white/10 pb-12 mb-16">
        <p className="font-label text-ytw-terracotta text-[10px] tracking-[0.3em] uppercase mb-6">
          04 · Join us
        </p>
        <h2
          className="book-headline font-display font-light text-white leading-tight"
          style={{ fontSize: 'clamp(40px, 7vw, 100px)' }}
        >
          Ready to
          <br />
          <em>begin?</em>
        </h2>
      </div>

      {/* Two columns */}
      <div className="grid md:grid-cols-2 gap-16 md:gap-24">
        {/* Book a class */}
        <div className="book-col">
          <h3 className="font-label text-white/50 text-[11px] tracking-[0.25em] uppercase mb-6">
            Book a class
          </h3>
          <p className="font-sans text-white/60 text-[15px] leading-relaxed mb-10 max-w-xs">
            Drop-in and package rates available. Beginners are always welcome —
            no experience needed, just curiosity.
          </p>
          <a
            href="https://instagram.com/yogatayoelnido"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-ytw-terracotta text-white font-label text-[11px] tracking-[0.22em] uppercase px-8 py-4 hover:bg-ytw-cognac transition-colors duration-400"
          >
            Book via Instagram →
          </a>

          {/* Schedule teaser */}
          <div className="mt-12 space-y-3">
            {[
              { time: '06:30', label: 'Sunrise Yoga' },
              { time: '09:00', label: 'Hatha Flow' },
              { time: '17:30', label: 'Pilates' },
              { time: '19:00', label: 'Yin & Meditation' },
            ].map(({ time, label }) => (
              <div key={time} className="flex items-center gap-4 border-b border-white/8 pb-3">
                <span className="font-label text-ytw-terracotta text-[11px] tracking-wide w-16">{time}</span>
                <span className="font-sans text-white/60 text-[14px]">{label}</span>
              </div>
            ))}
            <p className="font-label text-white/30 text-[10px] tracking-[0.2em] uppercase pt-1">
              Schedule may vary — check Instagram for daily updates
            </p>
          </div>
        </div>

        {/* Find us */}
        <div className="book-col">
          <h3 className="font-label text-white/50 text-[11px] tracking-[0.25em] uppercase mb-6">
            Find us
          </h3>
          <div className="space-y-6 text-white/60 font-sans text-[15px]">
            <div>
              <p className="font-label text-white/30 text-[10px] tracking-[0.2em] uppercase mb-2">Location</p>
              <p>El Nido town proper</p>
              <p>Palawan, Philippines</p>
            </div>
            <div>
              <p className="font-label text-white/30 text-[10px] tracking-[0.2em] uppercase mb-2">Studio hours</p>
              <p>Daily · 06:00 – 20:00</p>
            </div>
            <div>
              <p className="font-label text-white/30 text-[10px] tracking-[0.2em] uppercase mb-2">Café hours</p>
              <p>Daily · 07:00 – 21:00</p>
            </div>
            <div>
              <p className="font-label text-white/30 text-[10px] tracking-[0.2em] uppercase mb-2">Follow</p>
              <a
                href="https://instagram.com/yogatayoelnido"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors duration-300"
              >
                @yogatayoelnido
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

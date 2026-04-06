'use client';

import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';

interface SiteNavProps {
  onBook: () => void;
}

export default function SiteNav({ onBook }: SiteNavProps) {
  const navRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    gsap.from(navRef.current, {
      y: -20, opacity: 0, duration: 1.0, ease: 'power3.out', delay: 0.2,
    });
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-8 md:px-14 h-16 transition-all duration-500 ${
        scrolled ? 'bg-ytw-dark/85 backdrop-blur-md border-b border-white/8' : 'bg-transparent'
      }`}
    >
      {/* Logo */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="flex flex-col leading-none group text-left"
        aria-label="Yoga Tayo home"
      >
        <span className="font-display font-light text-white text-[18px] tracking-wide group-hover:text-ytw-terracotta transition-colors duration-300">
          Yoga Tayo
        </span>
        <span className="font-label text-white/40 text-[8px] tracking-[0.3em] uppercase">
          &amp; Om Nom Nom
        </span>
      </button>

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-8">
        {[
          { label: 'Studio', id: 'studio' },
          { label: 'Café',   id: 'cafe'   },
        ].map(({ label, id }) => (
          <button
            key={id}
            onClick={() => scrollTo(id)}
            className="font-label text-white/60 text-[10px] tracking-[0.25em] uppercase hover:text-white transition-colors duration-300"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Book CTA — always visible */}
      <button
        onClick={onBook}
        className="inline-flex items-center gap-2 bg-ytw-terracotta text-white font-label text-[10px] tracking-[0.22em] uppercase px-6 py-2.5 hover:bg-ytw-cognac transition-colors duration-300"
      >
        Book a class
      </button>
    </nav>
  );
}

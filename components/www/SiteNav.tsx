'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';

interface SiteNavProps {
  onBook: () => void;
}

const NAV_LINKS = [
  { label: 'Studio', id: 'studio' },
  { label: 'Café',   id: 'cafe'   },
];

function AnimatedLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative group font-label text-white/60 text-[10px] tracking-[0.25em] uppercase hover:text-white transition-colors duration-300"
    >
      {label}
      <span className="absolute -bottom-px left-0 h-px w-0 bg-ytw-terracotta group-hover:w-full transition-[width] duration-300 ease-out" />
    </button>
  );
}

export default function SiteNav({ onBook }: SiteNavProps) {
  const navRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <nav
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-8 md:px-14 h-16 transition-all duration-500 ${
          scrolled
            ? 'bg-ytw-dark/90 backdrop-blur-md border-b border-white/[0.06]'
            : 'bg-transparent'
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
          {NAV_LINKS.map(({ label, id }) => (
            <AnimatedLink key={id} label={label} onClick={() => scrollTo(id)} />
          ))}
        </div>

        <div className="flex items-center gap-4">
          {/* Book CTA — outline slides up to fill on hover */}
          <button
            onClick={onBook}
            className="group relative overflow-hidden border border-ytw-terracotta text-ytw-terracotta font-label text-[10px] tracking-[0.22em] uppercase px-6 py-2.5 hover:text-white transition-colors duration-300"
          >
            <span
              className="absolute inset-0 bg-ytw-terracotta translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"
              aria-hidden="true"
            />
            <span className="relative z-10">Book a class</span>
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden flex flex-col gap-[5px] w-6 h-5 justify-center items-center"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            <motion.span
              animate={menuOpen ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
              className="block h-px w-6 bg-white origin-center"
              transition={{ duration: 0.25 }}
            />
            <motion.span
              animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
              className="block h-px w-6 bg-white"
              transition={{ duration: 0.2 }}
            />
            <motion.span
              animate={menuOpen ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
              className="block h-px w-6 bg-white origin-center"
              transition={{ duration: 0.25 }}
            />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed top-16 left-0 right-0 z-30 bg-ytw-dark/95 backdrop-blur-md border-b border-white/[0.06] px-8 py-6 flex flex-col gap-6 md:hidden"
          >
            {NAV_LINKS.map(({ label, id }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="text-left font-label text-white/70 text-[11px] tracking-[0.28em] uppercase hover:text-white transition-colors duration-300"
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => { setMenuOpen(false); onBook(); }}
              className="self-start font-label text-ytw-terracotta text-[11px] tracking-[0.28em] uppercase border-b border-ytw-terracotta/50 pb-0.5 hover:border-ytw-terracotta transition-colors duration-300"
            >
              Book a class →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const CLASSES = [
  {
    id: 'yoga',
    label: 'Yoga',
    description: 'Hatha, Vinyasa & Yin — suited for all levels, set to the sound of the sea.',
    image: 'https://images.pexels.com/photos/3822906/pexels-photo-3822906.jpeg?auto=compress&cs=tinysrgb&w=800&h=1100&fit=crop',
  },
  {
    id: 'pilates',
    label: 'Pilates',
    description: 'Mat-based Pilates focused on strength, alignment, and deep core stability.',
    image: 'https://images.pexels.com/photos/4498606/pexels-photo-4498606.jpeg?auto=compress&cs=tinysrgb&w=800&h=1100&fit=crop',
  },
  {
    id: 'meditation',
    label: 'Meditation',
    description: 'Guided sessions at sunrise and sunset, opening and closing the day with stillness.',
    image: 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=800&h=1100&fit=crop',
  },
];

export default function ClassesSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from('.classes-heading', {
      y: 50, opacity: 0, duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: '.classes-heading', start: 'top 85%' },
    });

    ScrollTrigger.batch('.class-card', {
      onEnter: (els) =>
        gsap.from(els, { y: 60, opacity: 0, duration: 1, stagger: 0.15, ease: 'power3.out' }),
      start: 'top 80%',
    });
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      id="classes"
      className="bg-ytw-dark overflow-hidden py-28 md:py-40 px-8 md:px-14"
    >
      {/* Section header */}
      <div className="classes-heading flex items-end justify-between mb-16 md:mb-24 border-b border-white/10 pb-8">
        <div>
          <p className="font-label text-ytw-terracotta text-[10px] tracking-[0.3em] uppercase mb-4">
            02 · What we offer
          </p>
          <h2
            className="font-display font-light text-white leading-tight"
            style={{ fontSize: 'clamp(32px, 5vw, 72px)' }}
          >
            Move. Breathe.
            <br />
            <em>Be present.</em>
          </h2>
        </div>
        <button
          onClick={() => document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' })}
          className="hidden md:flex font-label text-white/50 text-[11px] tracking-[0.22em] uppercase items-center gap-2 hover:text-white hover:gap-4 transition-all duration-300"
        >
          Book now <span>→</span>
        </button>
      </div>

      {/* Class cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {CLASSES.map(({ id, label, description, image }) => (
          <div key={id} className="class-card group cursor-pointer">
            <div className="aspect-[3/4] overflow-hidden mb-6 relative">
              <img
                src={image}
                alt={`${label} class at Yoga Tayo El Nido`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                loading="lazy"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-ytw-terracotta/0 group-hover:bg-ytw-terracotta/15 transition-colors duration-500" />
            </div>

            <p className="font-label text-ytw-terracotta/70 text-[10px] tracking-[0.3em] uppercase mb-2">
              {id.padStart(2, '0')}
            </p>
            <h3 className="font-display font-light text-white text-2xl md:text-3xl mb-3">
              {label}
            </h3>
            <p className="font-sans text-white/50 text-[14px] leading-relaxed">
              {description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

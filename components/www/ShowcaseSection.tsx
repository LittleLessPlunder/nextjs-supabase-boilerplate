'use client';

import { useRef, useEffect } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const IMAGES = [
  {
    src: 'https://images.pexels.com/photos/1591361/pexels-photo-1591361.jpeg?auto=compress&cs=tinysrgb&w=1400',
    alt: 'Beachfront yoga studio at Lio Beach El Nido',
    caption: 'Lio Beach · El Nido',
    wide: true,
  },
  {
    src: 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=800',
    alt: 'Morning yoga practice with ocean view',
    caption: 'Sunrise flow',
    wide: false,
  },
  {
    src: 'https://images.pexels.com/photos/6787202/pexels-photo-6787202.jpeg?auto=compress&cs=tinysrgb&w=800',
    alt: 'Pilates class on the second floor studio',
    caption: '2nd floor studio',
    wide: false,
  },
];

export default function ShowcaseSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.from('.showcase-label', {
      y: 40, opacity: 0, duration: 1.0, ease: 'power3.out',
      scrollTrigger: { trigger: '.showcase-label', start: 'top 85%' },
    });
    gsap.from('.showcase-heading', {
      y: 60, opacity: 0, duration: 1.4, ease: 'power3.out',
      scrollTrigger: { trigger: '.showcase-heading', start: 'top 80%' },
    });
    gsap.from('.showcase-body', {
      y: 30, opacity: 0, duration: 1.0, ease: 'power3.out',
      scrollTrigger: { trigger: '.showcase-body', start: 'top 85%' },
    });
    gsap.from('.showcase-img', {
      y: 50, opacity: 0, duration: 1.2, stagger: 0.15, ease: 'power3.out',
      scrollTrigger: { trigger: '.showcase-grid', start: 'top 80%' },
    });
    gsap.from('.showcase-stat', {
      y: 20, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out',
      scrollTrigger: { trigger: '.showcase-stats', start: 'top 85%' },
    });
  }, []);

  return (
    <section
      ref={sectionRef}
      id="studio"
      className="bg-ytw-offwhite py-28 md:py-44 px-8 md:px-14 overflow-hidden"
    >
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-20 md:mb-28">
        <p className="showcase-label font-label text-ytw-terracotta text-[10px] tracking-[0.35em] uppercase mb-8">
          01 · The Studio
        </p>
        <div className="grid md:grid-cols-2 gap-12 items-end">
          <h2
            className="showcase-heading font-display font-light text-ytw-dark leading-tight"
            style={{ fontSize: 'clamp(38px, 5.5vw, 88px)' }}
          >
            Above the sea,<br />
            <em className="text-ytw-terracotta">below the sky.</em>
          </h2>
          <div className="showcase-body">
            <p className="font-sans text-ytw-dark/60 text-[15px] leading-relaxed mb-6">
              Perched on the second floor of a beachfront building at Lio Beach, Yoga Tayo is where
              the sound of the ocean meets your breath. Floor-to-ceiling open air, salt in the wind,
              light pouring through at every hour.
            </p>
            <p className="font-sans text-ytw-dark/60 text-[15px] leading-relaxed">
              A space for movement, stillness, and the kind of quiet only El Nido can offer.
            </p>
          </div>
        </div>
      </div>

      {/* Photo grid */}
      <div className="showcase-grid max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-20">
        {IMAGES.map((img, i) => (
          <div
            key={i}
            className={`showcase-img overflow-hidden ${img.wide ? 'col-span-2 md:col-span-2 aspect-[16/9]' : 'aspect-square'}`}
          >
            <div className="relative w-full h-full group">
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-ytw-dark/0 group-hover:bg-ytw-dark/20 transition-colors duration-500" />
              <span className="absolute bottom-3 left-4 font-label text-white/80 text-[10px] tracking-[0.2em] uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {img.caption}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div className="showcase-stats max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-px bg-ytw-dark/10">
        {[
          { value: '4+', label: 'Classes daily' },
          { value: '2F', label: 'Beachfront · Lio' },
          { value: '6am', label: 'Sunrise open' },
          { value: 'All levels', label: 'Welcome' },
        ].map(({ value, label }) => (
          <div key={label} className="showcase-stat bg-ytw-offwhite p-8 md:p-10">
            <p className="font-display font-light text-ytw-dark text-[40px] md:text-[52px] leading-none mb-2">{value}</p>
            <p className="font-label text-ytw-dark/40 text-[10px] tracking-[0.25em] uppercase">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

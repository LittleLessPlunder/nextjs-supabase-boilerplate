'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const CAFE_IMAGES = [
  {
    src: 'https://images.pexels.com/photos/1855214/pexels-photo-1855214.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
    alt: 'Om Nom Nom café El Nido',
    className: 'col-span-1 row-span-2',
  },
  {
    src: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    alt: 'Healthy food at Om Nom Nom',
    className: 'col-span-1 row-span-1',
  },
  {
    src: 'https://images.pexels.com/photos/2294363/pexels-photo-2294363.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    alt: 'Tropical drinks at Om Nom Nom',
    className: 'col-span-1 row-span-1',
  },
];

export default function CafeSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from('.cafe-label', {
      x: -30, opacity: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: '.cafe-label', start: 'top 85%' },
    });
    gsap.from('.cafe-headline', {
      y: 60, opacity: 0, duration: 1.2, ease: 'power3.out',
      scrollTrigger: { trigger: '.cafe-headline', start: 'top 80%' },
    });
    gsap.from('.cafe-tagline', {
      y: 20, opacity: 0, duration: 0.9, delay: 0.2, ease: 'power3.out',
      scrollTrigger: { trigger: '.cafe-tagline', start: 'top 85%' },
    });
    gsap.from('.cafe-body', {
      y: 30, opacity: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: '.cafe-body', start: 'top 85%' },
    });

    ScrollTrigger.batch('.cafe-img', {
      onEnter: (els) =>
        gsap.from(els, { x: 40, opacity: 0, duration: 1, stagger: 0.12, ease: 'power3.out' }),
      start: 'top 80%',
    });
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      id="cafe"
      className="overflow-hidden py-28 md:py-40"
      style={{ backgroundColor: '#F9ECDE' }}
    >
      <div className="px-8 md:px-14">
        {/* Top label */}
        <div className="cafe-label flex items-center gap-4 mb-12">
          <span className="font-label text-[10px] tracking-[0.3em] uppercase" style={{ color: '#555934' }}>
            03 · Also with us
          </span>
          <div className="h-px flex-1 max-w-[40px]" style={{ backgroundColor: '#555934', opacity: 0.3 }} />
        </div>

        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-start">
          {/* Left — text */}
          <div>
            <h2
              className="cafe-headline font-display font-light leading-none tracking-tight mb-6"
              style={{
                fontSize: 'clamp(56px, 9vw, 120px)',
                color: '#555934',
              }}
            >
              Om Nom
              <br />
              <em>Nom</em>
            </h2>

            <p
              className="cafe-tagline font-display italic text-xl md:text-2xl mb-10"
              style={{ color: '#8B6914', fontSize: 'clamp(18px, 2vw, 28px)' }}
            >
              "good food, good mood"
            </p>

            <p
              className="cafe-body font-sans text-[16px] leading-relaxed max-w-sm"
              style={{ color: '#3A2F1E', opacity: 0.75 }}
            >
              Our café is the warm, happy sibling of the studio. Expect fresh Filipino-inspired bowls,
              tropical smoothies, specialty coffee, and all-day breakfasts — made with local ingredients
              and a lot of love.
            </p>

            <p
              className="cafe-body font-sans text-[16px] leading-relaxed max-w-sm mt-5"
              style={{ color: '#3A2F1E', opacity: 0.75 }}
            >
              Open daily · El Nido town proper
            </p>
          </div>

          {/* Right — image grid */}
          <div className="grid grid-cols-2 grid-rows-2 gap-3 h-[520px] md:h-[600px]">
            {CAFE_IMAGES.map(({ src, alt, className }) => (
              <div key={src} className={`cafe-img overflow-hidden ${className}`}>
                <img
                  src={src}
                  alt={alt}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 ease-out"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom divider — terracotta accent */}
      <div className="mt-20 mx-8 md:mx-14 h-px" style={{ backgroundColor: '#F8B94E', opacity: 0.4 }} />
    </section>
  );
}

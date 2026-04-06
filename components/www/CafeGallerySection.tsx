'use client';

import { useRef, useEffect } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const CAFE_POSTS = [
  {
    src: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=600',
    alt: 'Specialty coffee at Om Nom Nom café',
  },
  {
    src: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600',
    alt: 'Fresh tropical breakfast bowl',
  },
  {
    src: 'https://images.pexels.com/photos/1099680/pexels-photo-1099680.jpeg?auto=compress&cs=tinysrgb&w=600',
    alt: 'Healthy café food at Om Nom Nom',
  },
  {
    src: 'https://images.pexels.com/photos/3692882/pexels-photo-3692882.jpeg?auto=compress&cs=tinysrgb&w=600',
    alt: 'Matcha latte with art',
  },
  {
    src: 'https://images.pexels.com/photos/1132558/pexels-photo-1132558.jpeg?auto=compress&cs=tinysrgb&w=600',
    alt: 'Tropical smoothie bowl',
  },
  {
    src: 'https://images.pexels.com/photos/2067396/pexels-photo-2067396.jpeg?auto=compress&cs=tinysrgb&w=600',
    alt: 'Café interior with natural light',
  },
];

export default function CafeGallerySection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.from('.cafe-label', {
      y: 40, opacity: 0, duration: 1.0, ease: 'power3.out',
      scrollTrigger: { trigger: '.cafe-label', start: 'top 85%' },
    });
    gsap.from('.cafe-heading', {
      y: 60, opacity: 0, duration: 1.4, ease: 'power3.out',
      scrollTrigger: { trigger: '.cafe-heading', start: 'top 80%' },
    });
    gsap.from('.cafe-post', {
      y: 40, opacity: 0, duration: 1.0, stagger: 0.08, ease: 'power3.out',
      scrollTrigger: { trigger: '.cafe-grid', start: 'top 80%' },
    });
    gsap.from('.cafe-footer', {
      y: 20, opacity: 0, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: '.cafe-footer', start: 'top 90%' },
    });
  }, []);

  return (
    <section
      ref={sectionRef}
      id="cafe"
      className="py-28 md:py-44 px-8 md:px-14 overflow-hidden"
      style={{ background: '#F9ECDE' }}
    >
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-16 md:mb-24">
        <p className="cafe-label font-label text-onn-matcha text-[10px] tracking-[0.35em] uppercase mb-8">
          02 · Om Nom Nom
        </p>
        <div className="grid md:grid-cols-2 gap-10 items-end">
          <h2
            className="cafe-heading font-display font-light leading-tight"
            style={{ fontSize: 'clamp(38px, 5.5vw, 88px)', color: '#2B2B1F' }}
          >
            Fuel your <br />
            <em style={{ color: '#555934' }}>practice.</em>
          </h2>
          <p className="font-sans text-[15px] leading-relaxed" style={{ color: 'rgba(43,43,31,0.55)' }}>
            Below the studio, our café serves everything you need before and after class — specialty coffee,
            tropical bowls, fresh juice, and bites made with care. Open daily from 7am.
          </p>
        </div>
      </div>

      {/* Instagram-style grid */}
      <div className="cafe-grid max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 mb-12">
        {CAFE_POSTS.map((post, i) => (
          <div key={i} className="cafe-post aspect-square overflow-hidden group relative">
            <Image
              src={post.src}
              alt={post.alt}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 flex items-center justify-center"
              style={{ background: 'rgba(85,89,52,0.35)' }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white" className="opacity-80">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Footer link */}
      <div className="cafe-footer max-w-7xl mx-auto flex items-center gap-4">
        <div className="flex-1 h-px" style={{ background: 'rgba(43,43,31,0.12)' }} />
        <a
          href="https://instagram.com/yogatayoelnido"
          target="_blank"
          rel="noopener noreferrer"
          className="font-label text-[11px] tracking-[0.25em] uppercase transition-opacity hover:opacity-60 duration-300"
          style={{ color: '#555934' }}
        >
          @yogatayoelnido on Instagram
        </a>
        <div className="flex-1 h-px" style={{ background: 'rgba(43,43,31,0.12)' }} />
      </div>
    </section>
  );
}

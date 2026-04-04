'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const links = [
  { label: 'Classes', href: '#classes' },
  { label: 'Café', href: '#cafe' },
  { label: 'Find Us', href: '#location' },
  { label: 'Book a Class', href: '#book', cta: true },
];

export default function PublicNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-yt-beige/95 backdrop-blur-sm shadow-sm' : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/www" className="flex items-center gap-2">
          <Image
            src="/ytw-icon.png"
            alt="Yoga Tayo"
            width={36}
            height={36}
            className="rounded-full"
          />
          <span className="font-averia text-lg font-bold text-yt-terracotta">
            Yoga Tayo
          </span>
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className={
                  link.cta
                    ? 'rounded-full bg-yt-terracotta px-5 py-2 text-sm font-semibold text-yt-beige transition-opacity hover:opacity-90'
                    : 'text-sm text-yt-cognac transition-colors hover:text-yt-terracotta'
                }
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

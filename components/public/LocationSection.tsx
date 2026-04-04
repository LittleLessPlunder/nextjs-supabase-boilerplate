'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export default function LocationSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10%' });

  return (
    <section id="location" className="bg-yt-beige px-6 py-24" ref={ref}>
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <p className="mb-3 font-averia text-sm uppercase tracking-[0.2em] text-yt-cognac">
            Come Visit
          </p>
          <h2 className="font-averia text-4xl font-bold text-yt-terracotta md:text-5xl">
            Find Us
          </h2>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2 md:items-start">
          {/* Details */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col gap-6"
          >
            <div>
              <p className="text-xs uppercase tracking-wider text-yt-cognac/60">Address</p>
              <p className="mt-1 text-yt-terracotta">
                El Nido, Palawan
                <br />
                Philippines
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-yt-cognac/60">Studio Hours</p>
              <p className="mt-1 text-yt-terracotta">
                Mon – Sat · 7:00 AM – 6:00 PM
                <br />
                Sunday · 7:00 AM – 12:00 PM
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-yt-cognac/60">Café Hours</p>
              <p className="mt-1 text-yt-terracotta">
                Daily · 7:00 AM – 5:00 PM
              </p>
            </div>
            <a
              href="#book"
              className="self-start rounded-full bg-yt-terracotta px-6 py-3 text-sm font-semibold text-yt-beige transition-opacity hover:opacity-90"
            >
              Book a Class
            </a>
          </motion.div>

          {/* Map placeholder — replace with Google Maps embed */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="aspect-video overflow-hidden rounded-2xl bg-yt-sand"
          >
            <div className="flex h-full w-full items-center justify-center text-sm text-yt-cognac/40">
              Map embed
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

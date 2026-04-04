'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const highlights = [
  { name: 'Specialty Coffee', description: 'Locally sourced beans, expertly brewed.' },
  { name: 'Fresh Smoothies', description: 'Tropical fruits, no added sugar.' },
  { name: 'All-Day Bites', description: 'Light, nourishing meals to fuel your practice.' },
  { name: 'Filipino Flavours', description: 'A nod to local ingredients and traditions.' },
];

export default function CafeSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10%' });

  return (
    <section id="cafe" className="bg-onn-cream px-6 py-24" ref={ref}>
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-16 md:grid-cols-2 md:items-center">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <p className="mb-3 font-averia text-sm uppercase tracking-[0.2em] text-onn-matcha">
              Our Café
            </p>
            <h2 className="font-averia text-4xl font-bold text-yt-terracotta md:text-5xl">
              Om Nom Nom
            </h2>
            <p className="mt-2 font-averia text-lg italic text-yt-cognac">
              good food, good mood
            </p>
            <p className="mt-6 leading-relaxed text-yt-cognac/80">
              Right next to the studio, Om Nom Nom is our little café corner —
              the perfect place to refuel after class or simply hang out with
              good food and great company.
            </p>

            <ul className="mt-8 grid grid-cols-2 gap-4">
              {highlights.map((item, i) => (
                <motion.li
                  key={item.name}
                  initial={{ opacity: 0, y: 12 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.1 * i }}
                  className="flex flex-col gap-1"
                >
                  <span className="font-semibold text-yt-terracotta">
                    {item.name}
                  </span>
                  <span className="text-sm text-yt-cognac/70">
                    {item.description}
                  </span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Photo placeholder — replace with real café photo */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="aspect-[4/5] overflow-hidden rounded-3xl bg-onn-milk-tea"
          >
            <div className="flex h-full w-full items-center justify-center text-sm text-yt-cognac/40">
              Café photo
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

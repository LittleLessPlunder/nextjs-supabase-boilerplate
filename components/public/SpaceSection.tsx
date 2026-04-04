'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

// Placeholder gallery items — replace src values with real photos
const photos = [
  { id: 1, alt: 'The studio space', aspect: 'tall' },
  { id: 2, alt: 'Yoga class in session', aspect: 'wide' },
  { id: 3, alt: 'Outdoor view', aspect: 'square' },
  { id: 4, alt: 'Studio detail', aspect: 'square' },
];

export default function SpaceSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10%' });

  return (
    <section id="space" className="bg-yt-beige px-6 py-24" ref={ref}>
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16 max-w-xl"
        >
          <p className="mb-3 font-averia text-sm uppercase tracking-[0.2em] text-yt-cognac">
            The Space
          </p>
          <h2 className="font-averia text-4xl font-bold text-yt-terracotta md:text-5xl">
            Your sanctuary
            <br />
            in El Nido
          </h2>
          <p className="mt-4 text-yt-cognac/80">
            Nestled in the heart of El Nido, our studio is designed to help you
            slow down, breathe, and reconnect — whether you're a seasoned
            practitioner or stepping on the mat for the first time.
          </p>
        </motion.div>

        {/* Gallery grid — placeholder tiles */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {photos.map((photo, i) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className={`overflow-hidden rounded-2xl bg-yt-sand ${
                photo.aspect === 'tall'
                  ? 'row-span-2 aspect-[3/4]'
                  : photo.aspect === 'wide'
                    ? 'col-span-2 aspect-video'
                    : 'aspect-square'
              }`}
            >
              {/* Replace with <Image> once real photos are available */}
              <div className="flex h-full w-full items-center justify-center text-xs text-yt-cognac/40">
                {photo.alt}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

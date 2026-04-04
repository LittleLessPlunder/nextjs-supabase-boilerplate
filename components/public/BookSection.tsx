'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface Props {
  standalone?: boolean;
}

export default function BookSection({ standalone = false }: Props) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10%' });

  return (
    <section
      id="book"
      className={`px-6 py-24 ${standalone ? '' : 'bg-yt-sand'}`}
      ref={ref}
    >
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <p className="mb-3 font-averia text-sm uppercase tracking-[0.2em] text-yt-cognac">
            Reserve Your Spot
          </p>
          <h2 className="font-averia text-4xl font-bold text-yt-terracotta md:text-5xl">
            Book a Class
          </h2>
          <p className="mt-4 text-yt-cognac/80">
            Choose a session below and fill in your details. We'll confirm your
            booking by email.
          </p>
        </motion.div>

        {/* Booking form — to be wired to Supabase classes/bookings tables */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="rounded-3xl bg-white p-8 shadow-lg"
        >
          <p className="text-center text-sm text-yt-cognac/60">
            Booking engine coming soon — schedule integration in progress.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

'use client';

import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-yt-terracotta">
      {/* Background — replace src with actual photo/video */}
      <div className="absolute inset-0 bg-yt-terracotta/60" />

      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center text-yt-beige">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-averia text-sm uppercase tracking-[0.25em] opacity-80"
        >
          El Nido, Palawan
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="font-averia text-5xl font-bold leading-tight md:text-7xl"
        >
          Move.
          <br />
          Eat.
          <br />
          Be.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="max-w-md text-base opacity-80 md:text-lg"
        >
          Yoga and pilates classes in paradise, followed by good food at
          Om&nbsp;Nom&nbsp;Nom café.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex gap-4"
        >
          <a
            href="#book"
            className="rounded-full bg-yt-beige px-8 py-3 text-sm font-semibold text-yt-terracotta transition-opacity hover:opacity-90"
          >
            Book a Class
          </a>
          <a
            href="#classes"
            className="rounded-full border border-yt-beige/50 px-8 py-3 text-sm font-semibold text-yt-beige transition-colors hover:border-yt-beige"
          >
            See Schedule
          </a>
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="flex flex-col items-center gap-2 text-yt-beige/60">
          <span className="text-xs tracking-widest">SCROLL</span>
          <div className="h-8 w-px bg-yt-beige/40" />
        </div>
      </motion.div>
    </section>
  );
}

'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const classes = [
  {
    name: 'Hatha Yoga',
    level: 'All levels',
    duration: '60 min',
    description:
      'A grounding practice focusing on alignment, breathwork, and foundational postures.',
  },
  {
    name: 'Vinyasa Flow',
    level: 'Intermediate',
    duration: '75 min',
    description:
      'Dynamic movement linked with breath — energising, flowing, and rhythmic.',
  },
  {
    name: 'Pilates',
    level: 'All levels',
    duration: '60 min',
    description:
      'Core-centred movement to build strength, stability, and body awareness.',
  },
  {
    name: 'Yin Yoga',
    level: 'All levels',
    duration: '75 min',
    description:
      'Long, passive holds that release deep connective tissue and calm the nervous system.',
  },
];

export default function ClassesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10%' });

  return (
    <section id="classes" className="bg-yt-olive px-6 py-24" ref={ref}>
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <p className="mb-3 font-averia text-sm uppercase tracking-[0.2em] text-yt-sand/70">
              What We Offer
            </p>
            <h2 className="font-averia text-4xl font-bold text-yt-beige md:text-5xl">
              Classes
            </h2>
          </div>
          <a
            href="#book"
            className="self-start rounded-full bg-yt-terracotta px-6 py-3 text-sm font-semibold text-yt-beige transition-opacity hover:opacity-90 md:self-auto"
          >
            View Full Schedule
          </a>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2">
          {classes.map((cls, i) => (
            <motion.div
              key={cls.name}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className="flex flex-col gap-3 rounded-2xl bg-yt-beige/10 p-6 text-yt-beige backdrop-blur-sm"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-averia text-xl font-bold">{cls.name}</h3>
                <span className="rounded-full bg-yt-beige/15 px-3 py-1 text-xs">
                  {cls.duration}
                </span>
              </div>
              <span className="text-xs uppercase tracking-wider text-yt-sand/70">
                {cls.level}
              </span>
              <p className="text-sm leading-relaxed opacity-75">
                {cls.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

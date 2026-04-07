'use client';

import { MapPin, Users, Clock } from 'lucide-react';

const pillars = [
  {
    icon: MapPin,
    label: 'El Nido, Palawan',
    description: 'Nestled in one of the world\'s most beautiful bays.',
  },
  {
    icon: Users,
    label: 'Inclusive community',
    description: 'Locals, expats, and travellers — all welcome, every day.',
  },
  {
    icon: Clock,
    label: 'Flexible schedule',
    description: 'Morning, afternoon, and evening sessions, seven days a week.',
  },
];

export const About = () => {
  return (
    <section id="about" className="py-24 sm:py-32 bg-muted/30">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — visual composition */}
          <div className="relative">
            {/* Main colour block */}
            <div
              className="rounded-3xl aspect-[4/3] w-full"
              style={{
                background:
                  'linear-gradient(135deg, hsl(16 30% 85%) 0%, hsl(67 20% 82%) 100%)',
              }}
            />

            {/* Overlapping accent card */}
            <div className="absolute -bottom-6 -right-4 lg:-right-8 rounded-2xl bg-card border border-border shadow-lg p-5 max-w-[220px]">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
                Our shala
              </p>
              <p className="text-sm text-foreground leading-snug">
                Open-air, sea-breeze cooled, and built from local materials.
              </p>
            </div>

            {/* Top-left badge */}
            <div className="absolute -top-4 -left-4 lg:-left-6 rounded-2xl bg-primary text-primary-foreground px-5 py-3 shadow-md">
              <p className="text-xs font-medium opacity-80 uppercase tracking-widest">Founded</p>
              <p className="text-2xl font-bold">2018</p>
            </div>
          </div>

          {/* Right — copy */}
          <div className="space-y-8">
            <div>
              <p className="text-xs font-medium text-primary uppercase tracking-widest mb-3">
                Our story
              </p>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-5">
                Rooted in place,<br />open to all.
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                Yoga Tayo — "let's do yoga" in Filipino — started as a small mat on a
                beach in El Nido. Today we run a full wellness studio where the island's
                natural beauty is woven into every session.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our teachers bring together Hatha lineage, contemporary pilates, and
                mindful breathwork. Whether you're a first-timer or a seasoned
                practitioner, we'll meet you where you are.
              </p>
            </div>

            {/* Pillars */}
            <div className="space-y-4">
              {pillars.map(({ icon: Icon, label, description }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{label}</p>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

'use client';

import { Sunset, Waves, Moon, Zap, Heart, Leaf } from 'lucide-react';

interface ClassType {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  duration: string;
  level: string;
  tag: string;
  accent: string;
  iconColor: string;
}

const classes: ClassType[] = [
  {
    icon: Sunset,
    title: 'Sunrise Hatha',
    subtitle: 'Begin your day with a grounding practice as the sun rises over Bacuit Bay.',
    duration: '60 min',
    level: 'All levels',
    tag: 'Morning',
    accent: 'hsl(16 30% 90%)',
    iconColor: 'text-primary',
  },
  {
    icon: Waves,
    title: 'Vinyasa Flow',
    subtitle: 'Dynamic movement synced with breath — energise and build heat.',
    duration: '75 min',
    level: 'Intermediate',
    tag: 'Afternoon',
    accent: 'hsl(200 35% 88%)',
    iconColor: 'text-[hsl(200_50%_45%)]',
  },
  {
    icon: Moon,
    title: 'Yin & Restore',
    subtitle: 'Slow, deep stretches to unwind. The perfect close to an island day.',
    duration: '60 min',
    level: 'All levels',
    tag: 'Evening',
    accent: 'hsl(270 20% 90%)',
    iconColor: 'text-[hsl(270_30%_50%)]',
  },
  {
    icon: Zap,
    title: 'Power Pilates',
    subtitle: 'Core-focused mat work with resistance training for real strength.',
    duration: '50 min',
    level: 'Intermediate',
    tag: 'Pilates',
    accent: 'hsl(67 20% 88%)',
    iconColor: 'text-[hsl(67_30%_38%)]',
  },
  {
    icon: Heart,
    title: 'Breathwork',
    subtitle: 'Pranayama and guided breathing to calm the nervous system.',
    duration: '45 min',
    level: 'All levels',
    tag: 'Meditation',
    accent: 'hsl(350 30% 90%)',
    iconColor: 'text-[hsl(350_50%_50%)]',
  },
  {
    icon: Leaf,
    title: 'Private Sessions',
    subtitle: 'One-on-one guidance tailored to your goals — any style, any time.',
    duration: 'Flexible',
    level: 'Any level',
    tag: 'Private',
    accent: 'hsl(150 20% 88%)',
    iconColor: 'text-[hsl(150_35%_38%)]',
  },
];

export const Services = () => {
  return (
    <section id="classes" className="py-24 sm:py-32 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="max-w-xl mb-14">
          <p className="text-xs font-medium text-primary uppercase tracking-widest mb-3">
            What we offer
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
            Classes for every body.
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            From energising morning flows to restorative evening sessions — all held
            in our open-air shala overlooking the sea.
          </p>
        </div>

        {/* Card grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(({ icon: Icon, title, subtitle, duration, level, tag, accent, iconColor }) => (
            <article
              key={title}
              className="group relative rounded-2xl border border-border bg-card p-6 flex flex-col gap-4 hover:shadow-md transition-shadow duration-200 cursor-default"
            >
              {/* Icon pill */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: accent }}
              >
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>

              {/* Copy */}
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1.5">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{subtitle}</p>
              </div>

              {/* Meta row */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">{duration}</span>
                  <span className="text-border">·</span>
                  <span className="text-xs text-muted-foreground">{level}</span>
                </div>
                <span
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wide uppercase"
                  style={{ background: accent, color: 'hsl(var(--foreground) / 0.7)' }}
                >
                  {tag}
                </span>
              </div>
            </article>
          ))}
        </div>

        {/* Bottom note */}
        <p className="text-center text-sm text-muted-foreground mt-10">
          Drop-in welcome · Packages available · Gear provided upon request
        </p>
      </div>
    </section>
  );
};

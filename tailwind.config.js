/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}'
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      fontFamily: {
        sans:   ['var(--font-rubik)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        averia: ['var(--font-averia)', 'Georgia', 'serif'],
        sans:    ['var(--font-rubik)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-averia)', 'Georgia', 'serif'],
        label:   ['var(--font-lekton)', 'ui-monospace', 'monospace'],      },
      colors: {
        border: 'hsl(var(--border))',
        input:  'hsl(var(--input))',
        ring:   'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        // ─── Yoga Tayo brand palette ──────────────────────────────────
        'yt-terracotta': '#A55437',
        'yt-olive':      '#808368',
        'yt-cognac':     '#C08253',
        'yt-sand':       '#E9D6C1',
        'yt-beach':      '#D4B28F',
        'yt-beige':      '#F9ECDE',

        // ─── Om Nom Nom brand palette ─────────────────────────────────
        'onn-mango':    '#F8B94E',
        'onn-matcha':   '#555934',
        'onn-mocha':    '#D4B28F',  // same as yt-beach
        'onn-cream':    '#F9ECDE',  // same as yt-beige
        'onn-milk-tea': '#E9D6C1',  // same as yt-sand
        // ── Yoga Tayo brand palette (www site — explicit values, not CSS vars)
        ytw: {
          dark:       '#1C1207',
          'off-white': '#F5F0E8',
          offwhite:   '#F5F0E8',
          sand:       '#D4C5A9',
          cognac:     '#8B5A2B',
          terracotta: '#C25C3E',
          olive:      '#4A5240',
        },
        // ── Om Nom Nom brand palette
        onn: {
          cream:   '#F9ECDE',
          greige:  '#E9D6C1',
          mocha:   '#D4B28F',
          mango:   '#F8B94E',
          matcha:  '#555934',
        },      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
      },
      // Warm-tinted shadows — use terracotta undertone, not cold grey
      boxShadow: {
        sm:  '0 1px 2px 0 hsl(16 40% 30% / 0.06)',
        DEFAULT: '0 1px 3px 0 hsl(16 40% 30% / 0.08), 0 1px 2px -1px hsl(16 40% 30% / 0.06)',
        md:  '0 4px 8px -1px hsl(16 40% 30% / 0.10), 0 2px 4px -2px hsl(16 40% 30% / 0.07)',
        lg:  '0 8px 20px -3px hsl(16 40% 30% / 0.12), 0 4px 8px -4px hsl(16 40% 30% / 0.08)',
        xl:  '0 16px 32px -4px hsl(16 40% 30% / 0.14), 0 6px 12px -6px hsl(16 40% 30% / 0.10)',
        none: 'none',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        '120': '120ms',
        '150': '150ms',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' }
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' }
        },
        'fade-in-scale': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to:   { opacity: '1', transform: 'scale(1)' }
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-6px)' },
          to:   { opacity: '1', transform: 'translateX(0)' }
        },
      },
      animation: {
        'accordion-down':  'accordion-down 0.2s ease-out',
        'accordion-up':    'accordion-up 0.2s ease-out',
        'fade-in':         'fade-in 0.15s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in-scale':   'fade-in-scale 0.15s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-in-left':   'slide-in-left 0.15s cubic-bezier(0.16, 1, 0.3, 1) both',
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
};

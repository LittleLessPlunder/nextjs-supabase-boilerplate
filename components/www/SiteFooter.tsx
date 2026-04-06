export default function SiteFooter() {
  return (
    <footer className="bg-ytw-dark border-t border-white/8 px-8 md:px-14 py-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        {/* Brands */}
        <div className="flex flex-col gap-1">
          <span className="font-display font-light text-white text-lg tracking-[0.12em] uppercase">
            Yoga Tayo
          </span>
          <span
            className="font-display font-light text-lg tracking-[0.08em] uppercase"
            style={{ color: '#F8B94E' }}
          >
            + Om Nom Nom
          </span>
          <p className="font-label text-white/30 text-[10px] tracking-[0.2em] uppercase mt-2">
            El Nido, Palawan · Philippines
          </p>
        </div>

        {/* Links */}
        <nav className="flex flex-wrap gap-8">
          {[
            { label: 'Instagram', href: 'https://instagram.com/yogatayoelnido' },
            { label: 'Studio',    href: '#studio' },
            { label: 'Café',      href: '#cafe'   },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="font-label text-white/40 text-[10px] tracking-[0.22em] uppercase hover:text-white/80 transition-colors duration-300"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>

      <div className="mt-10 pt-6 border-t border-white/8 flex flex-col md:flex-row justify-between gap-3">
        <p className="font-label text-white/20 text-[10px] tracking-[0.15em] uppercase">
          © {new Date().getFullYear()} Yoga Tayo Wellness. All rights reserved.
        </p>
        <p className="font-label text-white/20 text-[10px] tracking-[0.15em] uppercase">
          www.yogatayoelnido.com
        </p>
      </div>
    </footer>
  );
}

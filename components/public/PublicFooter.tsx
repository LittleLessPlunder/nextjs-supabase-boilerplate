import Image from 'next/image';

export default function PublicFooter() {
  return (
    <footer className="bg-yt-terracotta px-6 py-12 text-yt-beige">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-start gap-8 md:flex-row md:items-end md:justify-between">
          {/* Yoga Tayo */}
          <div className="flex flex-col gap-3">
            <Image
              src="/ytw-icon.png"
              alt="Yoga Tayo"
              width={48}
              height={48}
              className="rounded-full opacity-90"
            />
            <p className="font-averia text-xl font-bold">Yoga Tayo</p>
            <p className="text-sm opacity-75">El Nido, Palawan</p>
          </div>

          {/* Om Nom Nom */}
          <div className="flex flex-col gap-2">
            <p className="font-averia text-lg font-bold">Om Nom Nom</p>
            <p className="text-sm opacity-75">good food, good mood</p>
          </div>

          {/* Links */}
          <nav className="flex flex-col gap-2 text-sm opacity-75">
            <a href="#classes" className="hover:opacity-100">Classes</a>
            <a href="#cafe" className="hover:opacity-100">Café</a>
            <a href="#book" className="hover:opacity-100">Book a Class</a>
            <a href="#location" className="hover:opacity-100">Find Us</a>
          </nav>
        </div>

        <div className="mt-10 border-t border-yt-beige/20 pt-6 text-xs opacity-50">
          © {new Date().getFullYear()} Yoga Tayo Wellness · El Nido, Palawan, Philippines
        </div>
      </div>
    </footer>
  );
}

import { Metadata } from 'next';
import BookSection from '@/components/public/BookSection';

export const metadata: Metadata = {
  title: 'Book a Class — Yoga Tayo El Nido',
};

export default function BookPage() {
  return (
    <main className="min-h-screen bg-yt-beige pt-24">
      <BookSection standalone />
    </main>
  );
}

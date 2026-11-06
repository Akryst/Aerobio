import type { Metadata } from 'next';
import Link from 'next/link';
import AnonymousWall from '@/components/AnonymousWall';

export const metadata: Metadata = {
  title: 'Guestbook moderation',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-xl space-y-4 px-3 py-10 sm:px-6">
      <Link href="/" className="aero-link">Back to desktop</Link>
      <AnonymousWall moderation />
    </main>
  );
}

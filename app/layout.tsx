import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Task Tracker Next.js & Prisma',
  description: 'Sistem Pengurusan Tugasan (Task Tracker) lengkap dengan Next.js App Router, Tailwind CSS, Prisma ORM, dan PostgreSQL.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ms">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}

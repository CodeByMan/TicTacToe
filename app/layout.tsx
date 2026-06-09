import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tic Tac Toe | Muhammad Ali Nawaz',
  description: 'Premium neon Tic Tac Toe game built with Next.js, React, TypeScript, and CSS.',
  authors: [{ name: 'Muhammad Ali Nawaz' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

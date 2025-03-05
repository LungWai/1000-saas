import type React from 'react';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: '1000 Grid Spaces',
  description: 'Lease your piece of digital real estate',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="bg-white text-black min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}

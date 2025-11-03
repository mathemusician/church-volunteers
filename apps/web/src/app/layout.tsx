import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './design-system.css';
import './m3-overrides.css';
import './signup-m3.css';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Volunteers - Volunteer Management System',
  description: 'Simplify volunteer management, amplify impact',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}

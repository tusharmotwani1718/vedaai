import type { Metadata } from 'next';
import { Bricolage_Grotesque } from 'next/font/google';

import './globals.css';

/**
 * Bricolage Grotesque is the family used throughout the Figma file. It is a
 * variable font, so no weight list is given — the full 200–800 range ships and
 * the type tokens in globals.css pick weights from it.
 */
const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VedaAI',
  description: 'Map student answers to question papers.',


  icons: { icon: '/assets/veda-ai-logo.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={bricolage.variable}>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RAMPRS | Luxury Heavyweight Streetwear & Tailored Linens',
  description: 'Contemporary luxury streetwear and bespoke tailoring designed in India. 240+ GSM dropped shoulder oversized tees, tactical cargo denim, and European flax linen.',
  metadataBase: new URL('https://ramprs.com'),
  openGraph: {
    title: 'RAMPRS | Luxury Heavyweight Streetwear',
    description: 'Elevated streetwear silhouettes engineered with luxury Indian craftsmanship.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'RAMPRS',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col font-sans antialiased text-neutral-900 bg-white">
        {children}
      </body>
    </html>
  );
}


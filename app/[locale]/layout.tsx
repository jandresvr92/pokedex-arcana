import type { Metadata } from 'next';
import { Crimson_Pro, DM_Sans, DM_Mono } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import './globals.css';

const crimsonPro = Crimson_Pro({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500', '600'],
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'Pokédex Arcana',
  description: 'An intelligent Pokémon encyclopedia powered by PokéAPI',
  icons: { icon: '/favicon.svg' },
};

const locales = ['en', 'es'];

export default async function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale)) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${crimsonPro.variable} ${dmSans.variable} ${dmMono.variable}`}>
      <body className="bg-arc-bg font-body antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

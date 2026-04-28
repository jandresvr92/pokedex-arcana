import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'es'],
  defaultLocale: 'es',
  localePrefix: 'as-needed', // default locale has no prefix
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};

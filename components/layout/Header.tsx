'use client';

import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface HeaderProps {
  locale: 'en' | 'es';
}

export function Header({ locale }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const toggleLocale = () => {
    const next = locale === 'es' ? 'en' : 'es';
    // Replace or prepend locale prefix
    const segments = pathname.split('/').filter(Boolean);
    if (segments[0] === 'es' || segments[0] === 'en') {
      segments[0] = next;
    } else {
      segments.unshift(next);
    }
    router.push('/' + segments.join('/'));
  };

  return (
    <header className="sticky top-0 z-40 px-4 py-3 border-b border-arc-border/60 bg-arc-bg/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <LogoMark />
          <div className="hidden sm:block">
            <h1 className="font-display text-xl font-semibold leading-none text-arc-text">
              Pokédex <span className="text-arc-accent">Arcana</span>
            </h1>
            <p className="font-body text-xs text-arc-muted mt-0.5 tracking-wide uppercase">
              {locale === 'es' ? 'Enciclopedia Pokémon' : 'Pokémon Encyclopedia'}
            </p>
          </div>
        </div>

        {/* Right: locale toggle */}
        <button
          onClick={toggleLocale}
          className={cn(
            'neo-sm rounded-xl px-4 py-2 flex items-center gap-2',
            'font-mono text-sm text-arc-muted hover:text-arc-text',
            'transition-all duration-200 hover:shadow-none',
            'active:shadow-[inset_2px_2px_5px_#C4C0BA,inset_-2px_-2px_5px_#FFFFFF]'
          )}
          aria-label={locale === 'es' ? 'Switch to English' : 'Cambiar a Español'}
        >
          <span className="text-base">{locale === 'es' ? '🇬🇧' : '🇪🇸'}</span>
          <span>{locale === 'es' ? 'EN' : 'ES'}</span>
        </button>
      </div>
    </header>
  );
}

// Minimal geometric logo mark — placeholder, easy to swap
function LogoMark() {
  return (
    <div
      className={cn(
        'w-9 h-9 rounded-xl neo-sm flex items-center justify-center',
        'bg-arc-card overflow-hidden relative flex-shrink-0'
      )}
    >
      {/* Pokéball-inspired split */}
      <div className="absolute inset-0 flex flex-col">
        <div className="flex-1 bg-arc-accent/20" />
        <div className="h-px bg-arc-border" />
        <div className="flex-1 bg-arc-surface" />
      </div>
      {/* Center circle */}
      <div className="relative z-10 w-3 h-3 rounded-full neo-sm border border-arc-border bg-arc-card" />
    </div>
  );
}

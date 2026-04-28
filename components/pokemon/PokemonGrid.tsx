'use client';

import Image from 'next/image';
import { cn, padId, capitalize } from '@/lib/utils';
import { getTypeColor, getTypeDualGradientStyle } from '@/lib/typeColors';
import type { PokemonCard } from '@/lib/types';

interface PokemonGridProps {
  cards: PokemonCard[];
  loading: boolean;
  onSelect: (id: number) => void;
  locale: 'en' | 'es';
}

export function PokemonGrid({ cards, loading, onSelect, locale }: PokemonGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <p className="font-display italic text-arc-muted text-xl">
          {locale === 'es' ? 'No se encontraron Pokémon' : 'No Pokémon found'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {cards.map((card, i) => (
        <PokemonCardItem
          key={card.id}
          card={card}
          onSelect={onSelect}
          delay={Math.min(i, 9) * 50}
          locale={locale}
        />
      ))}
    </div>
  );
}

function PokemonCardItem({
  card,
  onSelect,
  delay,
  locale,
}: {
  card: PokemonCard;
  onSelect: (id: number) => void;
  delay: number;
  locale: 'en' | 'es';
}) {
  const gradientStyle = getTypeDualGradientStyle(card.types);
  const primaryType = card.types[0] ?? 'normal';
  const typeColor = getTypeColor(primaryType);

  return (
    <button
      onClick={() => onSelect(card.id)}
      className={cn(
        'neo rounded-2xl p-4 text-left',
        'group transition-all duration-250',
        'hover:shadow-none hover:translate-y-0.5',
        'active:shadow-[inset_2px_2px_6px_#C4C0BA,inset_-2px_-2px_6px_#FFFFFF]',
        'focus-visible:outline-2 focus-visible:outline-arc-accent',
        'animate-fade-up'
      )}
      style={{ animationDelay: `${delay}ms`, ...gradientStyle }}
      aria-label={`Ver ${capitalize(card.name)}`}
    >
      {/* Number */}
      <div className="font-mono text-xs text-arc-muted mb-1">
        #{padId(card.id)}
      </div>

      {/* Art */}
      <div className="relative w-full aspect-square mb-3 flex items-center justify-center">
        {card.officialArt ? (
          <Image
            src={card.officialArt}
            alt={card.name}
            fill
            sizes="(max-width: 640px) 40vw, (max-width: 1024px) 25vw, 200px"
            className="object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-md"
            unoptimized
          />
        ) : (
          <span className="text-4xl">❓</span>
        )}
      </div>

      {/* Name */}
      <p className="font-display font-medium text-sm text-arc-text capitalize mb-2 truncate">
        {capitalize(card.name)}
      </p>

      {/* Types */}
      <div className="flex flex-wrap gap-1">
        {card.types.map((t) => {
          const tc = getTypeColor(t);
          return (
            <span
              key={t}
              className={cn(
                'text-[10px] font-mono font-medium px-2 py-0.5 rounded-full',
                tc.bg, tc.text
              )}
            >
              {t}
            </span>
          );
        })}
      </div>
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="neo rounded-2xl p-4 space-y-2">
      <div className="skeleton h-3 w-10" />
      <div className="skeleton aspect-square w-full rounded-xl" />
      <div className="skeleton h-4 w-3/4" />
      <div className="flex gap-1">
        <div className="skeleton h-4 w-12 rounded-full" />
        <div className="skeleton h-4 w-12 rounded-full" />
      </div>
    </div>
  );
}

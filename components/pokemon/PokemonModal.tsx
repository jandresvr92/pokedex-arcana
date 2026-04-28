'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { cn, padId, capitalize, formatHeight, formatWeight } from '@/lib/utils';
import { getTypeColor, getTypeDualGradientStyle } from '@/lib/typeColors';
import { STAT_KEY_MAP } from '@/lib/pokeapi';
import type { PokemonDetail } from '@/lib/types';

interface PokemonModalProps {
  pokemonId: number;
  locale: 'en' | 'es';
  onClose: () => void;
}

type Tab = 'info' | 'stats' | 'story';

const STAT_MAX: Record<string, number> = {
  hp: 255, attack: 165, defense: 230,
  'special-attack': 194, 'special-defense': 230, speed: 200,
};

const GEN_LABELS: Record<string, string> = {
  'generation-i': 'I', 'generation-ii': 'II', 'generation-iii': 'III',
  'generation-iv': 'IV', 'generation-v': 'V', 'generation-vi': 'VI',
  'generation-vii': 'VII', 'generation-viii': 'VIII', 'generation-ix': 'IX',
};

export function PokemonModal({ pokemonId, locale, onClose }: PokemonModalProps) {
  const [detail, setDetail] = useState<PokemonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [shiny, setShiny] = useState(false);

  useEffect(() => {
    setLoading(true);
    setDetail(null);
    setActiveTab('info');
    fetch(`/api/pokemon/${pokemonId}?locale=${locale}`)
      .then((r) => r.json())
      .then(setDetail)
      .finally(() => setLoading(false));
  }, [pokemonId, locale]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'info', label: locale === 'es' ? 'Info' : 'Info' },
    { key: 'stats', label: locale === 'es' ? 'Stats' : 'Stats' },
    { key: 'story', label: locale === 'es' ? 'Historia' : 'Story' },
  ];

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-overlay bg-arc-text/30"
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className={cn(
          'w-full sm:max-w-lg',
          'neo rounded-t-3xl sm:rounded-3xl',
          'max-h-[92vh] sm:max-h-[85vh] flex flex-col',
          'animate-scale-in overflow-hidden'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <ModalSkeleton />
        ) : detail ? (
          <ModalContent
            detail={detail}
            locale={locale}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            shiny={shiny}
            setShiny={setShiny}
            tabs={tabs}
            onClose={onClose}
          />
        ) : (
          <div className="p-8 text-center text-arc-muted">
            {locale === 'es' ? 'No encontrado' : 'Not found'}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Modal content ───────────────────────────────────────────────────────────

interface ContentProps {
  detail: PokemonDetail;
  locale: 'en' | 'es';
  activeTab: Tab;
  setActiveTab: (t: Tab) => void;
  shiny: boolean;
  setShiny: (v: boolean) => void;
  tabs: { key: Tab; label: string }[];
  onClose: () => void;
}

function ModalContent({ detail, locale, activeTab, setActiveTab, shiny, setShiny, tabs, onClose }: ContentProps) {
  const gradientStyle = getTypeDualGradientStyle(detail.types);
  const primaryArt = shiny
    ? detail.sprite?.replace('pokemon/', 'pokemon/shiny/')
    : detail.officialArt ?? detail.sprite;

  const badges = [];
  if (detail.species.isLegendary) badges.push(locale === 'es' ? 'Legendario' : 'Legendary');
  if (detail.species.isMythical) badges.push(locale === 'es' ? 'Mítico' : 'Mythical');

  return (
    <>
      {/* Hero area */}
      <div className="relative p-6 pb-0 flex-shrink-0" style={gradientStyle}>
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 neo-sm rounded-full flex items-center justify-center text-arc-muted hover:text-arc-text transition-colors"
        >
          ✕
        </button>

        {/* Shiny toggle */}
        <button
          onClick={() => setShiny(!shiny)}
          title={shiny ? 'Normal' : 'Shiny'}
          className={cn(
            'absolute top-4 left-4 neo-sm rounded-full px-2 py-1',
            'text-xs font-mono transition-all',
            shiny ? 'text-arc-gold' : 'text-arc-muted'
          )}
        >
          ✦ {locale === 'es' ? (shiny ? 'Shiny' : 'Normal') : (shiny ? 'Shiny' : 'Normal')}
        </button>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Sprite */}
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex-shrink-0 animate-float">
            {primaryArt ? (
              <Image
                src={primaryArt}
                alt={detail.name}
                fill
                sizes="160px"
                className="object-contain drop-shadow-xl"
                unoptimized
              />
            ) : <span className="text-5xl">❓</span>}
          </div>

          {/* Name & types */}
          <div className="text-center sm:text-left">
            <p className="font-mono text-sm text-arc-muted mb-1">#{padId(detail.id)}</p>
            <h2 className="font-display text-3xl font-semibold text-arc-text mb-2">
              {capitalize(detail.name)}
            </h2>
            <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start mb-2">
              {detail.types.map((t) => {
                const tc = getTypeColor(t);
                return (
                  <span
                    key={t}
                    className={cn('px-3 py-0.5 rounded-full text-xs font-mono font-medium', tc.bg, tc.text)}
                  >
                    {t}
                  </span>
                );
              })}
            </div>
            {badges.length > 0 && (
              <div className="flex gap-1 flex-wrap justify-center sm:justify-start">
                {badges.map(b => (
                  <span key={b} className="text-xs bg-arc-gold/20 text-arc-gold px-2 py-0.5 rounded-full font-mono">
                    {b}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 -mb-px">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                'px-4 py-2 text-sm font-body font-medium rounded-t-xl transition-all',
                activeTab === t.key
                  ? 'bg-arc-bg text-arc-text shadow-inner'
                  : 'text-arc-muted hover:text-arc-text'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto bg-arc-bg p-5 rounded-b-3xl">
        {activeTab === 'info' && <InfoTab detail={detail} locale={locale} />}
        {activeTab === 'stats' && <StatsTab detail={detail} locale={locale} />}
        {activeTab === 'story' && <StoryTab detail={detail} locale={locale} />}
      </div>
    </>
  );
}

// ─── Info Tab ─────────────────────────────────────────────────────────────────

function InfoTab({ detail, locale: lc }: { detail: PokemonDetail; locale: 'en' | 'es' }) {
  const L = {
    height: lc === 'es' ? 'Altura' : 'Height',
    weight: lc === 'es' ? 'Peso' : 'Weight',
    abilities: lc === 'es' ? 'Habilidades' : 'Abilities',
    baseExp: lc === 'es' ? 'Exp. Base' : 'Base Exp.',
    hidden: lc === 'es' ? 'oculta' : 'hidden',
  };

  const rows = [
    { label: L.height, value: formatHeight(detail.height) },
    { label: L.weight, value: formatWeight(detail.weight) },
    { label: L.baseExp, value: String(detail.baseExperience ?? '—') },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Basic stats grid */}
      <div className="grid grid-cols-3 gap-3">
        {rows.map((r) => (
          <div key={r.label} className="neo-sm rounded-xl p-3 text-center">
            <p className="font-mono text-xs text-arc-muted mb-1">{r.label}</p>
            <p className="font-display text-lg font-medium">{r.value}</p>
          </div>
        ))}
      </div>

      {/* Abilities */}
      <div className="neo-sm rounded-xl p-4">
        <p className="font-mono text-xs text-arc-muted mb-2 uppercase tracking-wide">{L.abilities}</p>
        <div className="flex flex-wrap gap-2">
          {detail.abilities.map((a) => (
            <span
              key={a.name}
              className={cn(
                'neo-flat rounded-lg px-3 py-1 text-sm font-body',
                a.isHidden ? 'text-arc-muted italic' : 'text-arc-text'
              )}
            >
              {a.name}{a.isHidden ? ` (${L.hidden})` : ''}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Stats Tab ────────────────────────────────────────────────────────────────

const STAT_COLORS: Record<string, string> = {
  hp: 'bg-red-400', attack: 'bg-orange-400', defense: 'bg-yellow-500',
  'special-attack': 'bg-blue-400', 'special-defense': 'bg-teal-400', speed: 'bg-green-400',
};

const STAT_DISPLAY: Record<string, { es: string; en: string }> = {
  hp: { es: 'PS', en: 'HP' },
  attack: { es: 'Ataque', en: 'Attack' },
  defense: { es: 'Defensa', en: 'Defense' },
  'special-attack': { es: 'Atq. Esp.', en: 'Sp. Atk' },
  'special-defense': { es: 'Def. Esp.', en: 'Sp. Def' },
  speed: { es: 'Velocidad', en: 'Speed' },
};

function StatsTab({ detail, locale: lc }: { detail: PokemonDetail; locale: 'en' | 'es' }) {
  const total = detail.stats.reduce((s, st) => s + st.value, 0);

  return (
    <div className="space-y-3 animate-fade-in">
      {detail.stats.map((s) => {
        const max = STAT_MAX[s.name] ?? 200;
        const pct = Math.round((s.value / max) * 100);
        const color = STAT_COLORS[s.name] ?? 'bg-arc-muted';
        const label = STAT_DISPLAY[s.name]?.[lc] ?? capitalize(s.name);

        return (
          <div key={s.name} className="flex items-center gap-3">
            <span className="font-mono text-xs text-arc-muted w-20 text-right flex-shrink-0">
              {label}
            </span>
            <span className="font-mono text-sm font-medium w-8 text-right flex-shrink-0">
              {s.value}
            </span>
            <div className="flex-1 neo-inset rounded-full h-3 overflow-hidden">
              <div
                className={cn('h-full rounded-full stat-bar-fill', color)}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
      {/* Total */}
      <div className="flex items-center gap-3 pt-2 border-t border-arc-border">
        <span className="font-mono text-xs text-arc-muted w-20 text-right">
          {lc === 'es' ? 'Total' : 'Total'}
        </span>
        <span className="font-mono text-sm font-bold text-arc-text w-8 text-right">{total}</span>
        <div className="flex-1" />
      </div>
    </div>
  );
}

// ─── Story Tab ────────────────────────────────────────────────────────────────

function StoryTab({ detail, locale: lc }: { detail: PokemonDetail; locale: 'en' | 'es' }) {
  const { species } = detail;
  const genLabel = GEN_LABELS[species.generation] ?? species.generation;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Description */}
      <div className="neo-sm rounded-xl p-4">
        <p className="font-display italic text-arc-text leading-relaxed text-[15px]">
          {species.description || (lc === 'es' ? 'Sin descripción disponible.' : 'No description available.')}
        </p>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-3">
        {species.category && (
          <MetaCard label={lc === 'es' ? 'Categoría' : 'Category'} value={species.category} />
        )}
        {genLabel && (
          <MetaCard label={lc === 'es' ? 'Generación' : 'Generation'} value={`Gen. ${genLabel}`} />
        )}
        {species.eggGroups.length > 0 && (
          <MetaCard
            label={lc === 'es' ? 'Grupos Huevo' : 'Egg Groups'}
            value={species.eggGroups.join(', ')}
          />
        )}
        <MetaCard
          label={lc === 'es' ? 'Tasa Captura' : 'Catch Rate'}
          value={String(species.captureRate)}
        />
      </div>
    </div>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="neo-sm rounded-xl p-3">
      <p className="font-mono text-[10px] text-arc-muted uppercase tracking-wide mb-1">{label}</p>
      <p className="font-body text-sm text-arc-text">{value}</p>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ModalSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-4">
        <div className="skeleton w-36 h-36 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3 w-16" />
          <div className="skeleton h-8 w-40" />
          <div className="flex gap-2">
            <div className="skeleton h-5 w-16 rounded-full" />
            <div className="skeleton h-5 w-16 rounded-full" />
          </div>
        </div>
      </div>
      <div className="skeleton h-8 w-full rounded-xl" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-12 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

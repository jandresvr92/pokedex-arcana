// Maps Pokémon type names to Tailwind background + text color classes

export const TYPE_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  normal:   { bg: 'bg-stone-300',    text: 'text-stone-800',  accent: '#A8A878' },
  fire:     { bg: 'bg-orange-400',   text: 'text-white',      accent: '#F08030' },
  water:    { bg: 'bg-blue-400',     text: 'text-white',      accent: '#6890F0' },
  electric: { bg: 'bg-yellow-300',   text: 'text-yellow-900', accent: '#F8D030' },
  grass:    { bg: 'bg-green-400',    text: 'text-white',      accent: '#78C850' },
  ice:      { bg: 'bg-cyan-300',     text: 'text-cyan-900',   accent: '#98D8D8' },
  fighting: { bg: 'bg-red-600',      text: 'text-white',      accent: '#C03028' },
  poison:   { bg: 'bg-purple-400',   text: 'text-white',      accent: '#A040A0' },
  ground:   { bg: 'bg-amber-500',    text: 'text-white',      accent: '#E0C068' },
  flying:   { bg: 'bg-indigo-300',   text: 'text-indigo-900', accent: '#A890F0' },
  psychic:  { bg: 'bg-pink-400',     text: 'text-white',      accent: '#F85888' },
  bug:      { bg: 'bg-lime-500',     text: 'text-white',      accent: '#A8B820' },
  rock:     { bg: 'bg-yellow-700',   text: 'text-white',      accent: '#B8A038' },
  ghost:    { bg: 'bg-violet-600',   text: 'text-white',      accent: '#705898' },
  dragon:   { bg: 'bg-blue-700',     text: 'text-white',      accent: '#7038F8' },
  dark:     { bg: 'bg-neutral-700',  text: 'text-white',      accent: '#705848' },
  steel:    { bg: 'bg-slate-400',    text: 'text-white',      accent: '#B8B8D0' },
  fairy:    { bg: 'bg-pink-300',     text: 'text-pink-900',   accent: '#EE99AC' },
};

export function getTypeColor(type: string) {
  return TYPE_COLORS[type] ?? { bg: 'bg-gray-300', text: 'text-gray-800', accent: '#999' };
}

// Get a gradient from primary (and optional secondary) type
export function getTypeGradient(types: string[]): string {
  if (types.length === 0) return 'from-stone-300 to-stone-400';
  if (types.length === 1) {
    const c = getTypeColor(types[0]);
    return `${c.bg}`;
  }
  // dual type — we use inline style instead
  return '';
}

export function getTypeDualGradientStyle(types: string[]): React.CSSProperties {
  if (types.length < 2) {
    const acc = getTypeColor(types[0] ?? 'normal').accent;
    return { background: `linear-gradient(135deg, ${acc}33, ${acc}11)` };
  }
  const a = getTypeColor(types[0]).accent;
  const b = getTypeColor(types[1]).accent;
  return { background: `linear-gradient(135deg, ${a}44, ${b}33)` };
}

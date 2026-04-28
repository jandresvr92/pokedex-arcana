import {
  Pokemon,
  PokemonCard,
  PokemonDetail,
  PokemonListResponse,
  PokemonSpecies,
} from './types';

const BASE_URL = 'https://pokeapi.co/api/v2';
const PAGE_SIZE = 20;

// ─── Helpers ────────────────────────────────────────────────────────────────

function getOfficialArt(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');
}

/**
 * Maps raw stat names to display-friendly keys used in translations
 */
export const STAT_KEY_MAP: Record<string, string> = {
  hp: 'hp',
  attack: 'attack',
  defense: 'defense',
  'special-attack': 'spAttack',
  'special-defense': 'spDefense',
  speed: 'speed',
};

// ─── Fetch helpers ───────────────────────────────────────────────────────────

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { next: { revalidate: 3600 } }); // cache 1h
  if (!res.ok) throw new Error(`PokeAPI error: ${res.status} ${url}`);
  return res.json() as Promise<T>;
}

// ─── List ────────────────────────────────────────────────────────────────────

export async function getPokemonList(page: number = 1): Promise<{
  cards: PokemonCard[];
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}> {
  const offset = (page - 1) * PAGE_SIZE;
  const data = await apiFetch<PokemonListResponse>(
    `${BASE_URL}/pokemon?limit=${PAGE_SIZE}&offset=${offset}`
  );

  // Fetch minimal data for each (parallel)
  const cards = await Promise.all(
    data.results.map(async (p) => {
      const poke = await apiFetch<Pokemon>(p.url);
      return pokemonToCard(poke);
    })
  );

  return {
    cards,
    total: data.count,
    hasNext: !!data.next,
    hasPrev: !!data.previous,
  };
}

// ─── Search ──────────────────────────────────────────────────────────────────

export async function searchPokemon(query: string): Promise<PokemonCard | null> {
  try {
    const normalized = query.toLowerCase().trim().replace(/\s+/g, '-');
    const poke = await apiFetch<Pokemon>(`${BASE_URL}/pokemon/${normalized}`);
    return pokemonToCard(poke);
  } catch {
    return null;
  }
}

// ─── Detail ──────────────────────────────────────────────────────────────────

export async function getPokemonDetail(
  idOrName: string | number,
  locale: 'en' | 'es' = 'en'
): Promise<PokemonDetail | null> {
  try {
    const [poke, species] = await Promise.all([
      apiFetch<Pokemon>(`${BASE_URL}/pokemon/${idOrName}`),
      apiFetch<PokemonSpecies>(`${BASE_URL}/pokemon-species/${idOrName}`).catch(() => null),
    ]);

    return pokemonToDetail(poke, species, locale);
  } catch {
    return null;
  }
}

// ─── Transformers ────────────────────────────────────────────────────────────

function pokemonToCard(p: Pokemon): PokemonCard {
  return {
    id: p.id,
    name: p.name,
    types: p.types.map((t) => t.type.name),
    sprite: p.sprites.front_default,
    officialArt: p.sprites.other?.['official-artwork']?.front_default ?? getOfficialArt(p.id),
  };
}

function pokemonToDetail(
  p: Pokemon,
  species: PokemonSpecies | null,
  locale: 'en' | 'es'
): PokemonDetail {
  // Pick description in the right language (prefer the requested locale, fallback to en)
  let description = '';
  if (species) {
    const lang = locale === 'es' ? 'es' : 'en';
    const entry =
      species.flavor_text_entries.find((e) => e.language.name === lang) ??
      species.flavor_text_entries.find((e) => e.language.name === 'en');
    if (entry) {
      // Clean up control characters that PokeAPI returns
      description = entry.flavor_text.replace(/[\n\f\r]/g, ' ').trim();
    }
  }

  const category =
    species?.genera.find((g) => g.language.name === (locale === 'es' ? 'es' : 'en'))?.genus ??
    species?.genera.find((g) => g.language.name === 'en')?.genus ??
    '';

  return {
    id: p.id,
    name: p.name,
    types: p.types.map((t) => t.type.name),
    sprite: p.sprites.front_default,
    officialArt: p.sprites.other?.['official-artwork']?.front_default ?? getOfficialArt(p.id),
    height: p.height, // decimetres
    weight: p.weight, // hectograms
    baseExperience: p.base_experience,
    abilities: p.abilities.map((a) => ({
      name: capitalize(a.ability.name),
      isHidden: a.is_hidden,
    })),
    stats: p.stats.map((s) => ({
      name: s.stat.name,
      value: s.base_stat,
    })),
    species: {
      description,
      category,
      generation: species?.generation.name ?? '',
      eggGroups: species?.egg_groups.map((g) => capitalize(g.name)) ?? [],
      captureRate: species?.capture_rate ?? 0,
      isLegendary: species?.is_legendary ?? false,
      isMythical: species?.is_mythical ?? false,
    },
  };
}

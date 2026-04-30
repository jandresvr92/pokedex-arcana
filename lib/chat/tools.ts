import type {
  Pokemon,
  PokemonSpecies,
  PokemonTypeDetail,
  PokemonMove,
  EvolutionChain,
  EvolutionChainLink,
  LocationAreaEncounter,
} from '@/lib/types';
import { capitalize } from '@/lib/utils';
import { fetchJsonCached } from './cache';
import { getCompetitiveProfile, getMoveNote } from './data/battle-knowledge';

const BASE_URL = 'https://pokeapi.co/api/v2';
const TTL_POKEMON_MS = 10 * 60 * 1000;
const TTL_TYPES_MS = 60 * 60 * 1000;
const TTL_EVOLUTION_MS = 60 * 60 * 1000;
const TTL_MOVES_MS = 60 * 60 * 1000;
const TTL_ENCOUNTERS_MS = 60 * 60 * 1000;

function cacheKey(prefix: string, idOrName: string | number): string {
  return `${prefix}:${String(idOrName).toLowerCase()}`;
}

function getOfficialArt(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

async function fetchPokemon(idOrName: string | number): Promise<Pokemon> {
  return fetchJsonCached<Pokemon>(
    cacheKey('pokemon', idOrName),
    `${BASE_URL}/pokemon/${idOrName}`,
    TTL_POKEMON_MS
  );
}

async function fetchSpecies(idOrName: string | number): Promise<PokemonSpecies> {
  return fetchJsonCached<PokemonSpecies>(
    cacheKey('species', idOrName),
    `${BASE_URL}/pokemon-species/${idOrName}`,
    TTL_EVOLUTION_MS
  );
}

async function fetchType(typeName: string): Promise<PokemonTypeDetail> {
  return fetchJsonCached<PokemonTypeDetail>(
    cacheKey('type', typeName),
    `${BASE_URL}/type/${typeName}`,
    TTL_TYPES_MS
  );
}

async function fetchMove(moveName: string): Promise<PokemonMove> {
  return fetchJsonCached<PokemonMove>(
    cacheKey('move', moveName),
    `${BASE_URL}/move/${moveName}`,
    TTL_MOVES_MS
  );
}

async function fetchEncounters(encounterUrl: string, cacheId: string): Promise<LocationAreaEncounter[]> {
  return fetchJsonCached<LocationAreaEncounter[]>(
    cacheKey('encounters', cacheId),
    encounterUrl,
    TTL_ENCOUNTERS_MS
  );
}

function pickDescription(species: PokemonSpecies, locale: 'en' | 'es'): string {
  const lang = locale === 'es' ? 'es' : 'en';
  const entry =
    species.flavor_text_entries.find((e) => e.language.name === lang) ??
    species.flavor_text_entries.find((e) => e.language.name === 'en');
  if (!entry) return '';
  return entry.flavor_text.replace(/[\n\f\r]/g, ' ').trim();
}

function sumStats(stats: Array<{ value: number }>): number {
  return stats.reduce((acc, s) => acc + s.value, 0);
}

const ALL_TYPES = [
  'normal',
  'fire',
  'water',
  'grass',
  'electric',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
];

type StatKey = 'hp' | 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed';

function normalizeMoveName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

const MOVE_ALIASES: Record<string, string> = {
  ventisca: 'blizzard',
  'rayo hielo': 'ice beam',
  'rayo solar': 'solar beam',
  terremoto: 'earthquake',
  lanzallamas: 'flamethrower',
  hidrobomba: 'hydro pump',
  'bola sombra': 'shadow ball',
  rayo: 'thunderbolt',
  trueno: 'thunder',
  surf: 'surf',
};

function resolveMoveName(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\b(el|la|los|las)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return MOVE_ALIASES[cleaned] ?? cleaned;
}

function getBaseStat(stats: Pokemon['stats'], stat: StatKey): number {
  const entry = stats.find((s) => s.stat.name === stat);
  return entry ? entry.base_stat : 0;
}

function calcHp(base: number, level: number, iv = 31, ev = 0): number {
  const evTerm = Math.floor(ev / 4);
  return Math.floor(((2 * base + iv + evTerm) * level) / 100) + level + 10;
}

function calcStat(base: number, level: number, iv = 31, ev = 0, nature = 1): number {
  const evTerm = Math.floor(ev / 4);
  const raw = Math.floor(((2 * base + iv + evTerm) * level) / 100) + 5;
  return Math.floor(raw * nature);
}

function computeMultiplier(attacker: PokemonTypeDetail, defenderTypes: string[]): number {
  let multiplier = 1;
  defenderTypes.forEach((defType) => {
    if (attacker.damage_relations.no_damage_to.some((t) => t.name === defType)) {
      multiplier *= 0;
    } else if (attacker.damage_relations.double_damage_to.some((t) => t.name === defType)) {
      multiplier *= 2;
    } else if (attacker.damage_relations.half_damage_to.some((t) => t.name === defType)) {
      multiplier *= 0.5;
    }
  });
  return multiplier;
}

const NATURE_EFFECTS: Record<string, { up?: StatKey; down?: StatKey }> = {
  adamant: { up: 'attack', down: 'special-attack' },
  firme: { up: 'attack', down: 'special-attack' },
  modest: { up: 'special-attack', down: 'attack' },
  modesta: { up: 'special-attack', down: 'attack' },
  timid: { up: 'speed', down: 'attack' },
  miedosa: { up: 'speed', down: 'attack' },
  jolly: { up: 'speed', down: 'special-attack' },
  alegre: { up: 'speed', down: 'special-attack' },
  calm: { up: 'special-defense', down: 'attack' },
  serena: { up: 'special-defense', down: 'attack' },
  careful: { up: 'special-defense', down: 'special-attack' },
  cauta: { up: 'special-defense', down: 'special-attack' },
  bold: { up: 'defense', down: 'attack' },
  osada: { up: 'defense', down: 'attack' },
  relaxed: { up: 'defense', down: 'speed' },
  placida: { up: 'defense', down: 'speed' },
};

function resolveNatureEffect(nature: unknown): { up?: StatKey; down?: StatKey; name?: string } {
  if (!nature) return {};
  if (typeof nature === 'string') {
    const key = nature.toLowerCase().replace(/[^a-z]/g, '');
    const effect = NATURE_EFFECTS[key];
    return { ...effect, name: nature };
  }
  if (typeof nature === 'object' && nature) {
    const data = nature as { up?: StatKey; down?: StatKey; name?: string };
    return { up: data.up, down: data.down, name: data.name };
  }
  return {};
}

export interface ToolPokemon {
  id: number;
  name: string;
  types: string[];
  stats: { name: string; value: number }[];
  abilities: string[];
  height: number;
  weight: number;
  baseExperience: number;
  sprite: string | null;
  officialArt: string | null;
  description: string;
}

export async function getPokemon({
  name,
  locale = 'en',
}: {
  name: string;
  locale?: 'en' | 'es';
}): Promise<ToolPokemon> {
  const poke = await fetchPokemon(name);
  const species = await fetchSpecies(poke.id);

  return {
    id: poke.id,
    name: poke.name,
    types: poke.types.map((t) => t.type.name),
    stats: poke.stats.map((s) => ({
      name: s.stat.name,
      value: s.base_stat,
    })),
    abilities: poke.abilities.map((a) => capitalize(a.ability.name)),
    height: poke.height,
    weight: poke.weight,
    baseExperience: poke.base_experience,
    sprite: poke.sprites.front_default,
    officialArt: poke.sprites.other?.['official-artwork']?.front_default ?? getOfficialArt(poke.id),
    description: pickDescription(species, locale),
  };
}

function flattenEvolution(chain: EvolutionChainLink): string[][] {
  const stages: string[][] = [];
  let current: EvolutionChainLink[] = [chain];
  while (current.length > 0) {
    stages.push(current.map((node) => node.species.name));
    const next: EvolutionChainLink[] = [];
    current.forEach((node) => next.push(...node.evolves_to));
    current = next;
  }
  return stages;
}

export async function getEvolutionChain({ name }: { name: string }): Promise<{ stages: string[][] }> {
  const species = await fetchSpecies(name);
  const evo = await fetchJsonCached<EvolutionChain>(
    cacheKey('evolution', species.id),
    species.evolution_chain.url,
    TTL_EVOLUTION_MS
  );

  return {
    stages: flattenEvolution(evo.chain),
  };
}

export async function getPokemonEncounters({
  name,
  limit = 8,
}: {
  name: string;
  limit?: number;
}): Promise<{ name: string; locations: string[] }> {
  const poke = await fetchPokemon(name);
  const encounters = await fetchEncounters(poke.location_area_encounters, String(poke.id));
  const locations = encounters
    .map((entry) => entry.location_area.name)
    .filter(Boolean)
    .slice(0, limit);

  return {
    name: poke.name,
    locations,
  };
}

export async function getTypeEffectiveness({
  attackerTypes,
  defenderTypes,
}: {
  attackerTypes: string[];
  defenderTypes: string[];
}) {
  const attackers = attackerTypes.map((t) => t.toLowerCase());
  const defenders = defenderTypes.map((t) => t.toLowerCase());

  const attackerDetails = await Promise.all(attackers.map((t) => fetchType(t)));
  const perAttacker: Record<string, number> = {};

  attackerDetails.forEach((typeDetail, index) => {
    const typeName = attackers[index];
    let multiplier = 1;
    defenders.forEach((defType) => {
      if (typeDetail.damage_relations.no_damage_to.some((t) => t.name === defType)) {
        multiplier *= 0;
      } else if (typeDetail.damage_relations.double_damage_to.some((t) => t.name === defType)) {
        multiplier *= 2;
      } else if (typeDetail.damage_relations.half_damage_to.some((t) => t.name === defType)) {
        multiplier *= 0.5;
      }
    });
    perAttacker[typeName] = multiplier;
  });

  const multipliers = Object.values(perAttacker);
  const bestMultiplier = multipliers.length ? Math.max(...multipliers) : 1;

  return {
    attackerTypes: attackers,
    defenderTypes: defenders,
    perAttacker,
    bestMultiplier,
  };
}

export async function estimateMoveDamage({
  attacker,
  defender,
  move,
  level,
  nature,
  attackerEvs,
  defenderEvs,
}: {
  attacker: string;
  defender: string;
  move: string;
  level?: number;
  nature?: string | { up?: StatKey; down?: StatKey; name?: string };
  attackerEvs?: Partial<Record<StatKey, number>>;
  defenderEvs?: Partial<Record<StatKey, number>>;
}) {
  const finalLevel = typeof level === 'number' && Number.isFinite(level) ? level : 50;
  const cleanMove = normalizeMoveName(resolveMoveName(move));
  let attackerPoke: Pokemon;
  let defenderPoke: Pokemon;
  let moveData: PokemonMove;

  try {
    attackerPoke = await fetchPokemon(attacker);
  } catch {
    return { error: 'attacker_not_found', attacker };
  }

  try {
    defenderPoke = await fetchPokemon(defender);
  } catch {
    return { error: 'defender_not_found', defender };
  }

  try {
    moveData = await fetchMove(cleanMove);
  } catch {
    return { error: 'move_not_found', move: cleanMove };
  }

  const moveNote = getMoveNote(moveData.name) ?? getMoveNote(cleanMove);

  if (!moveData.power || moveData.damage_class.name === 'status') {
    return {
      error: 'move_has_no_power',
      move: moveData.name,
    };
  }

  const attackStatKey: StatKey = moveData.damage_class.name === 'physical'
    ? 'attack'
    : 'special-attack';
  const defenseStatKey: StatKey = moveData.damage_class.name === 'physical'
    ? 'defense'
    : 'special-defense';

  const attackerBase = getBaseStat(attackerPoke.stats, attackStatKey);
  const defenderBase = getBaseStat(defenderPoke.stats, defenseStatKey);
  const defenderHpBase = getBaseStat(defenderPoke.stats, 'hp');

  const natureEffect = resolveNatureEffect(nature);
  const natureMultiplier = (stat: StatKey) => {
    if (natureEffect.up === stat) return 1.1;
    if (natureEffect.down === stat) return 0.9;
    return 1;
  };

  const attackerStat = calcStat(
    attackerBase,
    finalLevel,
    31,
    attackerEvs?.[attackStatKey] ?? 0,
    natureMultiplier(attackStatKey)
  );
  const defenderStat = calcStat(
    defenderBase,
    finalLevel,
    31,
    defenderEvs?.[defenseStatKey] ?? 0,
    1
  );
  const defenderHp = calcHp(defenderHpBase, finalLevel, 31, defenderEvs?.hp ?? 0);

  const stab = attackerPoke.types.some((t) => t.type.name === moveData.type.name) ? 1.5 : 1;
  const effectiveness = await getTypeEffectiveness({
    attackerTypes: [moveData.type.name],
    defenderTypes: defenderPoke.types.map((t) => t.type.name),
  });

  const base = Math.floor(
    Math.floor(
      Math.floor(((2 * finalLevel) / 5 + 2) * moveData.power * (attackerStat / defenderStat)) / 50
    ) + 2
  );
  const minDamage = Math.floor(base * stab * effectiveness.bestMultiplier * 0.85);
  const maxDamage = Math.floor(base * stab * effectiveness.bestMultiplier);

  const minPercent = defenderHp > 0 ? (minDamage / defenderHp) * 100 : 0;
  const maxPercent = defenderHp > 0 ? (maxDamage / defenderHp) * 100 : 0;

  const assumptions: string[] = [];
  if (level === undefined) assumptions.push('level_assumed_50');
  if (!attackerEvs) assumptions.push('attacker_evs_assumed_0');
  if (!defenderEvs) assumptions.push('defender_evs_assumed_0');
  if (!natureEffect.up && !natureEffect.down) assumptions.push('nature_assumed_neutral');

  return {
    attacker: {
      name: attackerPoke.name,
      types: attackerPoke.types.map((t) => t.type.name),
    },
    defender: {
      name: defenderPoke.name,
      types: defenderPoke.types.map((t) => t.type.name),
    },
    move: {
      name: moveData.name,
      power: moveData.power,
      type: moveData.type.name,
      category: moveData.damage_class.name,
    },
    guide: moveNote
      ? {
          summary: moveNote.summary,
          notes: moveNote.notes,
        }
      : null,
    level: finalLevel,
    nature: natureEffect.name ?? null,
    attackStatKey,
    defenseStatKey,
    attackStat: attackerStat,
    defenseStat: defenderStat,
    defenderHp,
    stab,
    typeMultiplier: effectiveness.bestMultiplier,
    damageRange: { min: minDamage, max: maxDamage },
    percentRange: { min: minPercent, max: maxPercent },
    assumptions,
  };
}

export async function comparePokemons({ a, b }: { a: string; b: string }) {
  const [pokeA, pokeB] = await Promise.all([
    getPokemon({ name: a }),
    getPokemon({ name: b }),
  ]);
  const [aToB, bToA] = await Promise.all([
    getTypeEffectiveness({ attackerTypes: pokeA.types, defenderTypes: pokeB.types }),
    getTypeEffectiveness({ attackerTypes: pokeB.types, defenderTypes: pokeA.types }),
  ]);

  return {
    a: pokeA,
    b: pokeB,
    aToB,
    bToA,
    statTotals: {
      a: sumStats(pokeA.stats),
      b: sumStats(pokeB.stats),
    },
  };
}

export async function getBestCounters({
  target,
  limit = 5,
}: {
  target: string;
  limit?: number;
}) {
  const targetPokemon = await getPokemon({ name: target });
  const defenderTypes = targetPokemon.types;

  const typeDetails = await Promise.all(defenderTypes.map((t) => fetchType(t)));
  const strongTypes = new Set<string>();
  typeDetails.forEach((detail) => {
    detail.damage_relations.double_damage_from.forEach((t) => strongTypes.add(t.name));
  });

  const candidates = new Map<number, string>();
  const MAX_CANDIDATES = Math.max(limit * 3, 12);

  await Promise.all(
    Array.from(strongTypes).map(async (typeName) => {
      if (candidates.size >= MAX_CANDIDATES) return;
      const detail = await fetchType(typeName);
      for (const entry of detail.pokemon) {
        if (candidates.size >= MAX_CANDIDATES) break;
        const urlParts = entry.pokemon.url.split('/').filter(Boolean);
        const id = Number(urlParts[urlParts.length - 1]);
        if (!id || id === targetPokemon.id) continue;
        if (!candidates.has(id)) candidates.set(id, entry.pokemon.name);
      }
    })
  );

  const candidateList = Array.from(candidates.values()).slice(0, MAX_CANDIDATES);
  const evaluated = await Promise.all(
    candidateList.map(async (name) => {
      const poke = await getPokemon({ name });
      const effectiveness = await getTypeEffectiveness({
        attackerTypes: poke.types,
        defenderTypes,
      });
      const total = sumStats(poke.stats);
      const score = effectiveness.bestMultiplier * (total / 100);
      return {
        pokemon: poke,
        multiplier: effectiveness.bestMultiplier,
        statTotal: total,
        score,
      };
    })
  );

  evaluated.sort((a, b) => b.score - a.score);

  return {
    target: {
      name: targetPokemon.name,
      types: targetPokemon.types,
    },
    counters: evaluated.slice(0, limit).map((entry) => ({
      id: entry.pokemon.id,
      name: entry.pokemon.name,
      types: entry.pokemon.types,
      statTotal: entry.statTotal,
      multiplier: entry.multiplier,
    })),
  };
}

export async function suggestTeammates({
  target,
  limit = 5,
  maxCandidates = 60,
}: {
  target: string;
  limit?: number;
  maxCandidates?: number;
}) {
  const targetPokemon = await fetchPokemon(target);
  const targetTypes = targetPokemon.types.map((t) => t.type.name);
  const profile = getCompetitiveProfile(targetPokemon.name) ?? getCompetitiveProfile(target);

  const typeDetails = await Promise.all(ALL_TYPES.map((type) => fetchType(type)));
  const typeDetailMap = new Map(ALL_TYPES.map((type, index) => [type, typeDetails[index]]));

  const weaknesses = ALL_TYPES.filter((type, index) => {
    const mult = computeMultiplier(typeDetails[index], targetTypes);
    return mult > 1;
  });

  const candidateTypes = new Set<string>();
  weaknesses.forEach((weak) => {
    const detail = typeDetailMap.get(weak);
    if (!detail) return;
    detail.damage_relations.half_damage_to.forEach((t) => candidateTypes.add(t.name));
    detail.damage_relations.no_damage_to.forEach((t) => candidateTypes.add(t.name));
  });

  const candidates = new Map<number, string>();
  const PER_TYPE_CAP = 12;
  const MAX_CANDIDATES = Math.max(maxCandidates, limit * 10);
  const preferredNames = new Set<string>();

  if (profile) {
    for (const partner of profile.recommendedPartners) {
      const slug = normalizeMoveName(partner.name);
      const poke = await fetchPokemon(slug).catch(() => null);
      if (!poke) continue;
      candidates.set(poke.id, poke.name);
      preferredNames.add(poke.name);
    }
  }

  for (const typeName of candidateTypes) {
    if (candidates.size >= MAX_CANDIDATES) break;
    const detail = typeDetailMap.get(typeName) ?? (await fetchType(typeName));
    let added = 0;
    for (const entry of detail.pokemon) {
      if (candidates.size >= MAX_CANDIDATES || added >= PER_TYPE_CAP) break;
      const urlParts = entry.pokemon.url.split('/').filter(Boolean);
      const id = Number(urlParts[urlParts.length - 1]);
      if (!id || id === targetPokemon.id) continue;
      if (!candidates.has(id)) {
        candidates.set(id, entry.pokemon.name);
        added += 1;
      }
    }
  }

  const candidateList = Array.from(candidates.values());
  const evaluated = await Promise.all(
    candidateList.map(async (name) => {
      const poke = await fetchPokemon(name);
      const statTotal = poke.stats.reduce((acc, stat) => acc + stat.base_stat, 0);
      const types = poke.types.map((t) => t.type.name);
      const resisted: string[] = [];
      const immunities: string[] = [];
      const weakTo: string[] = [];

      weaknesses.forEach((weak) => {
        const detail = typeDetailMap.get(weak);
        if (!detail) return;
        const mult = computeMultiplier(detail, types);
        if (mult === 0) immunities.push(weak);
        else if (mult < 1) resisted.push(weak);
        else if (mult > 1) weakTo.push(weak);
      });

      const localBoost = preferredNames.has(name.toLowerCase()) ? 4 : 0;
      const score = immunities.length * 3 + resisted.length * 2 - weakTo.length + statTotal / 100 + localBoost;

      return {
        id: poke.id,
        name: poke.name,
        types,
        statTotal,
        resisted,
        immunities,
        weakTo,
        score,
        sprite: poke.sprites.front_default,
        officialArt: poke.sprites.other?.['official-artwork']?.front_default ?? getOfficialArt(poke.id),
      };
    })
  );

  evaluated.sort((a, b) => b.score - a.score);

  return {
    target: {
      name: targetPokemon.name,
      types: targetTypes,
    },
    profile: profile
      ? {
          format: profile.format,
          summary: profile.summary,
          roles: profile.roles,
          commonChecks: profile.commonChecks,
          notes: profile.notes,
          recommendedPartners: profile.recommendedPartners,
        }
      : null,
    weaknesses,
    candidatesConsidered: candidateList.length,
    teammates: evaluated.slice(0, limit).map((entry) => ({
      id: entry.id,
      name: entry.name,
      types: entry.types,
      statTotal: entry.statTotal,
      resisted: entry.resisted,
      immunities: entry.immunities,
      weakTo: entry.weakTo,
      score: entry.score,
    })),
  };
}

export async function getStrongestByType({
  type,
  limit = 3,
  maxCandidates = 0,
}: {
  type: string;
  limit?: number;
  maxCandidates?: number;
}) {
  const detail = await fetchType(type.toLowerCase());
  const allNames = detail.pokemon.map((entry) => entry.pokemon.name);
  const uniqueNames = Array.from(new Set(allNames));
  const candidates = maxCandidates > 0 ? uniqueNames.slice(0, maxCandidates) : uniqueNames;

  const evaluated: Array<{
    id: number;
    name: string;
    types: string[];
    statTotal: number;
    sprite: string | null;
    officialArt: string | null;
  }> = [];

  const CHUNK_SIZE = 20;
  for (let i = 0; i < candidates.length; i += CHUNK_SIZE) {
    const chunk = candidates.slice(i, i + CHUNK_SIZE);
    const chunkResults = await Promise.all(
      chunk.map(async (name) => {
        const poke = await fetchPokemon(name);
        const statTotal = poke.stats.reduce((acc, stat) => acc + stat.base_stat, 0);
        return {
          id: poke.id,
          name: poke.name,
          types: poke.types.map((t) => t.type.name),
          statTotal,
          sprite: poke.sprites.front_default,
          officialArt: poke.sprites.other?.['official-artwork']?.front_default ?? getOfficialArt(poke.id),
        };
      })
    );
    evaluated.push(...chunkResults);
  }

  evaluated.sort((a, b) => b.statTotal - a.statTotal);

  return {
    type: type.toLowerCase(),
    totalCount: uniqueNames.length,
    evaluatedCount: candidates.length,
    strongest: evaluated.slice(0, limit),
  };
}
